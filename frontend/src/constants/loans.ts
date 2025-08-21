

export interface loanRequest {
    id: string;
    borrower: string;
    principalAsset: string;
    collateralAsset: string;
    principalAmount: number;
    collateralAmount: number;
    receivingWallet: string;
    maxInterestRate: number;
    loanDuration: number;
    requestValidDays: number;
    listingFee: number;
}
