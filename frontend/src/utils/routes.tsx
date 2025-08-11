import Home from '../pages/dashboard/Home';
import Liquidity from '../pages/dashboard/Liquidity';
import Landing from '../pages/main/Landing';
import Markets from '../pages/main/Markets';
import { TbLayoutDashboardFilled } from 'react-icons/tb';
import { FaWallet } from "react-icons/fa6";

export type RouteType = {
  path: string;
  component: React.ComponentType;
  icon?: any;
  name?: string;
  isAux?: boolean;
};
export const getDashboardRoutes = ({ location }: { location: any }) => {
  const isOnDashBoard = location?.pathname?.includes('dashboard');
  return [
    {
      path: '/dashboard/home',
      component: Home,
      icon: <TbLayoutDashboardFilled />,
      name: 'Dashboard',
    },
    {
      path: '/dashboard/liquidity',
      component: Liquidity,
      icon: <FaWallet />,
      name: 'Liquidity Management',
    },
  ];
};

export const getMainRoutes = ({ location }: { location: any }): RouteType[] => {
  const dashboardRoutes = getDashboardRoutes({ location });

  return [
    { path: '/', component: Landing },
    { path: '/markets', component: Markets, name: 'Markets' },
    ...dashboardRoutes,
  ];
};
