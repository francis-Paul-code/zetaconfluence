import { FaSearch } from 'react-icons/fa';
import { FaMoneyBills, FaPlus, FaUser, FaWallet } from 'react-icons/fa6';
import { TbLayoutDashboardFilled } from 'react-icons/tb';

import Home from '../pages/dashboard/Home';
import Liquidity from '../pages/dashboard/Liquidity';
import P2PAccount from '../pages/dashboard/p2pmarket/Account';
import LoansHome from '../pages/dashboard/p2pmarket/Home';
import RequestLoan from '../pages/dashboard/p2pmarket/RequestLoan';
import Wallets from '../pages/dashboard/Wallets';
import Landing from '../pages/main/Landing';
import Markets from '../pages/main/Markets';

export type RouteType = {
  path: string;
  component: React.ComponentType;
  icon?: Element | any;
  name?: string;
  dashboard?: boolean;
  p2p?: boolean;
  ignore?:boolean;
  isLanding?:boolean
};

export const getDashboardRoutes = () => {
  return [
    {
      path: '/dashboard/home',
      component: Home,
      icon: TbLayoutDashboardFilled,
      name: 'Dashboard',
      dashboard: true,
    },
     {
      path: '/dashboard/liquidity',
      component: Liquidity,
      icon: FaMoneyBills,
      name: 'Liquidity Manager',
      dashboard: true,
    },{
      path: '/dashboard/p2p/request_loan',
      component: RequestLoan,
      icon: FaPlus,
      name: 'Request Loan',
      dashboard: true,
      p2p: true,
    },
    {
      path: '/dashboard/p2p/loans',
      component: LoansHome,
      icon: FaSearch,
      name: 'Browse Loans',
      dashboard: true,
      p2p: true,
    },
    {
      path: '/dashboard/p2p/loans/:loanId',
      component: LoansHome, // Same component, handles modal via route params
      dashboard: true,
      ignore:true
    },
    {
      path: '/dashboard/p2p/account',
      component: P2PAccount,
      icon: FaUser,
      name: 'My Account',
      dashboard: true,
      p2p: true,
    },
    {
      path: '/dashboard/wallets',
      component: Wallets,
      icon: FaWallet,
      name: 'Wallets',
      dashboard: true,
    },
  ];
};


export const getMainRoutes = (): RouteType[] => {
  return [
    { path: '/', component: Landing, isLanding:true},
     { path: '/markets', component: Markets, name: 'Markets' },
     ...getDashboardRoutes(),
  ];
};
