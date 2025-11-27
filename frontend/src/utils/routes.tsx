import { FaMoneyBills, FaWallet } from 'react-icons/fa6';
import { TbLayoutDashboardFilled } from 'react-icons/tb';

import Home from '../pages/dashboard/Home';
import Liquidity from '../pages/dashboard/Liquidity';
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
