import { OWNER_ACCOUNT } from "./config";
import type { Loan } from "./constants";
import { getContract } from "./contracts";
import { AppDataSource } from "./db";
import { Loan as _Loan } from "./entities/Loan";
import { getPrice } from "./pyth";

const LIQUIDATION_THRESHOLD = 1.05; // 80%

export async function runBot() {
  const contract = await getContract();

  const loanRepo = AppDataSource.getRepository(_Loan);
  const activeLoans = await loanRepo.find({ where: { active: true } });

  console.log(`Restoring ${activeLoans.length} active loans from DB...`);
  for (const loan of activeLoans) {
    watchLoan(Number(loan.loanId));
  }

  contract.on(
    "LoanActivated",
    async (
      loanId: bigint,
      activatedAt: bigint,
      deadline: bigint,
      borrower: string
    ) => {
      console.log(`New loan activated: ${loanId} by ${borrower}`);

      const loanRepo = AppDataSource.getRepository(_Loan);
      let loan = await loanRepo.findOne({
        where: { loanId: loanId.toString() },
      });

      if (!loan) {
        loan = loanRepo.create({
          active: true,
          borrower,
          loanId: loanId.toString(),
        });
        await loanRepo.save(loan);
      }

      watchLoan(Number(loanId));
    }
  );

  contract.on(
    "LoanCompleted",
    async (loanId: bigint, borrower: string, completedAt: bigint) => {
      console.log(
        `Loan Completed: ID: ${Number(
          loanId
        )} Borrower: ${borrower} Time: ${new Date(
          Number(completedAt)
        ).toISOString()}`
      );

      const loanRepo = AppDataSource.getRepository(_Loan);
      let loan = await loanRepo.findOne({
        where: { active: true, loanId: loanId.toString() },
      });

      if (loan) {
        loan.active = false;
        await loanRepo.save(loan);
      }
    }
  );
}

async function watchLoan(loanId: number) {
  const contract = await getContract();
  const loanRepo = AppDataSource.getRepository(_Loan);

  const interval = setInterval(async () => {
    try {
      const [loan, totalOwed, [collateralFeedId, principalFeedId]]: [
        Loan,
        bigint,
        [string, string]
      ] = await contract.getLoan(loanId);
      console.log(collateralFeedId);
      const collateralprice = await getPrice(collateralFeedId);
      const principalprice = await getPrice(principalFeedId);

      const collateralValue = Number(loan.collateralAmount) * collateralprice;
      const loanValue = Number(totalOwed) * principalprice;
      const ratio = collateralValue / loanValue;

      console.log(`Loan ${loanId}: liquidation ratio = ${ratio}`);

      if (ratio < LIQUIDATION_THRESHOLD) {
        console.log(`Loan ${loanId} below threshold. Liquidating...`);
        const tx = await contract.singleLoanLiquidation(loanId, OWNER_ACCOUNT);
        await tx.wait();
        console.log(`Loan ${loanId} liquidated.`);

        // Mark as inactive in DB
        const loan = await loanRepo.findOne({
          where: { loanId: loanId.toString() },
        });
        if (loan) {
          loan.active = false;
          await loanRepo.save(loan);
        }

        clearInterval(interval);
      }
    } catch (err) {
      console.error("Error watching loan:", err);
    }
  }, 30_000); // every 30s
}
