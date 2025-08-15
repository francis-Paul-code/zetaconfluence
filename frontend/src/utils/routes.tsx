/* eslint-disable @typescript-eslint/no-explicit-any */
import { FaMoneyBills, FaWallet } from 'react-icons/fa6';
import { TbLayoutDashboardFilled } from 'react-icons/tb';
import { RiP2pFill } from 'react-icons/ri';

import Home from '../pages/dashboard/Home';
import Liquidity from '../pages/dashboard/Liquidity';
import Landing from '../pages/main/Landing';
import Markets from '../pages/main/Markets';
import Wallets from '../pages/dashboard/Wallets';
import LoansHome from '../pages/dashboard/loans/Home';

export type RouteType = {
  path: string;
  component: React.ComponentType;
  icon?: Element | any;
  name?: string;
  dashboard?: boolean;
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
    },
    {
      path: '/dashboard/p2p/home',
      component: LoansHome,
      icon: RiP2pFill,
      name: 'P2P Loans Market',
      dashboard: true,
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
    { path: '/', component: Landing },
    { path: '/markets', component: Markets, name: 'Markets' },
    ...getDashboardRoutes(),
  ];
};
