import { TbLayoutDashboardFilled } from 'react-icons/tb';
import Landing from '../pages/main/Landing';
import Markets from '../pages/main/Markets';
import Home from '../pages/dashboard/Home';

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
    }
  ];
};


export const getMainRoutes = (): RouteType[] => {
  return [
    { path: '/', component: Landing, isLanding:true},
     { path: '/markets', component: Markets, name: 'Markets' },
  ];
};
