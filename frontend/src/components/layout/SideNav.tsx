import classNames from 'classnames';
import { motion } from 'motion/react';
import { TbLayoutSidebarRightCollapseFilled } from 'react-icons/tb';
import { TbLayoutSidebarLeftCollapseFilled } from 'react-icons/tb';
import { useLocation, useNavigate } from 'react-router';

import { useTheme } from '../../hooks/useTheme';
import { getDashboardRoutes } from '../../utils/routes';

export interface menuItem {
  name: string;
  icon?: Element | any;
  action?: (...args) => (void | unknown) | unknown;
  position: 'bottom' | 'top';
  route?: string;
}
const SideNav = ({
  open = false,
  setOpen,
}: {
  open: boolean;
  setOpen: (_value: boolean) => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const menuItems: menuItem[] = [
    ...getDashboardRoutes().map((item) => {
      return {
        ...item,
        route: item.path,
        position: item.path.includes('wallets') ? 'bottom' : 'top',
      } as menuItem;
    }),
    {
      name: 'Close',
      icon: open
        ? TbLayoutSidebarLeftCollapseFilled
        : TbLayoutSidebarRightCollapseFilled,
      action: () => setOpen(!open),
      position: 'bottom',
    },
  ];

  const goToRoute = (route: string) => navigate(route);

  return (
    <div className="w-full h-full grid grid-rows-[auto_auto_1fr_auto_auto] content-start justify-start">
      {menuItems.map((item, index) => {
        const isCurrentRoute = location?.pathname.includes(item.route!);
        return (
          <div
            id={`item-${item.name}`}
            className={
              ' h-auto flex items-center justify-start gap-2 py-2 px-3 text-sm rounded-lg no-select cursor-pointer hover:text-gray-400 dark:hover:text-gray-200 ' +
              classNames({
                'self-end ': item.position === 'bottom',
                'self-start': item.position === 'top',
                'mb-4': index !== menuItems.length - 1,
                'w-[190px]': open,
                ' hover:bg-gray-100 dark:hover:bg-gray-900': open,
                'w-auto': !open,
                '!text-primary': isCurrentRoute,
              })
            }
            onClick={() => {
              if (item.route) goToRoute(item.route);
              if (item.action) item.action();
            }}
          >
            <span className="h-[25px] w-auto aspect-square flex items-center">
              <item.icon size="100%" />
            </span>
            {open && (
              <motion.p
                animate={{
                  opacity: [0, 1],
                  y: [5, 0],
                  scale: [0.8, 1],
                }}
              >
                {item.name}
              </motion.p>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SideNav;
