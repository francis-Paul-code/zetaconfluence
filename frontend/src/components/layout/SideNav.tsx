 
import classNames from 'classnames';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { RiP2pFill } from 'react-icons/ri';
import {
  TbLayoutSidebarLeftCollapseFilled,
  TbLayoutSidebarRightCollapseFilled,
} from 'react-icons/tb';
import { useLocation, useNavigate } from 'react-router';

import { getDashboardRoutes } from '../../utils/routes';

export interface MenuItem {
  name: string;
  icon?: React.ElementType;
  action?: () => void;
  position: 'bottom' | 'top';
  path?: string;
  dropDown?: boolean;
  dropName?: string;
  dropIcon?: React.ElementType;
  dropList?: {
    name: string;
    icon?: React.ElementType;
    path?: string;
    action?: () => void;
  }[];
}

const SideNav = ({
  open = false,
  setOpen,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [dropDowns, setDropDowns] = useState<Record<string, boolean>>({});

  // Build menu items
  const menuItems: MenuItem[] = useMemo(
    () => [
      ...getDashboardRoutes().reduce((acc, item) => {
        if (item.ignore) return acc;

        const menuItem: MenuItem = {
          ...item,
          position: item.path.includes('wallets') ? 'bottom' : 'top',
        } as MenuItem;

        if (item.p2p) {
          const existingIndex = acc.findIndex(
            (i) => i.dropName === 'P2P Loans Market'
          );
          if (existingIndex !== -1) {
            acc[existingIndex] = {
              ...acc[existingIndex],
              dropList: [...(acc[existingIndex].dropList || []), item] as {
                name: string;
                icon?: React.ElementType;
                route?: string;
                action?: () => void;
              }[],
            };
          } else {
            acc.push({
              ...menuItem,
              dropName: 'P2P Loans Market',
              dropDown: true,
              dropIcon: RiP2pFill,
              dropList: [item] as {
                name: string;
                icon?: React.ElementType;
                route?: string;
                action?: () => void;
              }[],
            });
          }
        } else {
          acc.push(menuItem);
        }
        return acc;
      }, [] as MenuItem[]),
      {
        name: 'Close',
        icon: open
          ? TbLayoutSidebarLeftCollapseFilled
          : TbLayoutSidebarRightCollapseFilled,
        action: () => setOpen(!open),
        position: 'bottom',
      },
    ],
    [open]
  );

  // Initialize dropdown states (only once when menuItems change)
  useEffect(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach((item) => {
      if (item.dropDown && item.dropName) {
        initial[item.dropName] = false;
      }
    });
    setDropDowns(initial);
  }, [menuItems]);

  const goToRoute = (route: string) => navigate(route);

  return (
    <div className="w-full h-full grid grid-rows-[auto_auto_1fr_auto_auto] content-start justify-start">
      {menuItems.map((item, index) => {
        const isCurrentRoute = item.path
          ? location?.pathname.includes(item.path)
          : false;

        if (item.dropDown && item.dropName) {
          const DropIcon = item.dropIcon!;
          return (
            <div
              key={item.name}
              id={`item-${item.name}`}
              className={classNames(
                'h-auto py-2 text-sm no-select cursor-pointer',
                {
                  'self-end': item.position === 'bottom',
                  'self-start': item.position === 'top',
                  'mb-4': index !== menuItems.length - 1,
                  'w-[190px]': open,
                  'w-auto': !open,
                }
              )}
              onClick={() =>
                setDropDowns((prev) => ({
                  ...prev,
                  [item.dropName!]: !prev[item.dropName!],
                }))
              }
            >
              <div
                className={classNames(
                  'w-full rounded-lg flex items-center gap-2 py-2 px-3 hover:text-gray-400 dark:hover:text-gray-200',
                  { 'hover:bg-gray-100 dark:hover:bg-gray-900': open }
                )}
              >
                <span className="h-[25px] aspect-square flex items-center">
                  <DropIcon size="100%" />
                </span>
                {open && (
                  <motion.p
                    animate={{ opacity: [0, 1], y: [5, 0], scale: [0.8, 1] }}
                  >
                    {item.dropName}
                  </motion.p>
                )}
              </div>

              {!open && dropDowns[item.dropName] && (
                <span className="h-[20px] w-full aspect-square flex items-center my-2 px-2 text-gray-500">
                  <MdKeyboardArrowDown size="100%" />
                </span>
              )}

              {dropDowns[item.dropName] && (
                <div
                  className={
                    'h-auto ' +
                    classNames({ 'w-[calc(100%-26px)] ml-auto': open, 'w-full': !open })
                  }
                >
                  {item.dropList?.map((_item, i) => {
                    const isDropRoute = _item.path
                      ? location?.pathname.includes(_item.path)
                      : false;
                    const DropItemIcon = _item.icon!;
                    return (
                      <div
                        key={_item.name}
                        id={`item-${_item.name}`}
                        className={classNames(
                          'w-full ml-auto flex items-center gap-2 py-2 px-3 text-sm  rounded-lg no-select cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-gray-400 dark:hover:text-gray-200',
                          {
                            '!text-primary': isDropRoute,
                          }
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (_item.path) goToRoute(_item.path);
                          if (_item.action) _item.action();
                        }}
                      >
                        {DropItemIcon && (
                          <span className="h-[20px] aspect-square flex items-center">
                            <DropItemIcon size="100%" />
                          </span>
                        )}
                        {open && <p>{_item.name}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const Icon = item.icon!;
        return (
          <div
            key={item.name}
            id={`item-${item.name}`}
            className={classNames(
              'h-auto flex items-center gap-2 py-2 px-3 text-sm rounded-lg no-select cursor-pointer hover:text-gray-400 dark:hover:text-gray-200',
              {
                'self-end': item.position === 'bottom',
                'self-start': item.position === 'top',
                'mb-4': index !== menuItems.length - 1,
                'w-[190px] hover:bg-gray-100 dark:hover:bg-gray-900': open,
                'w-auto': !open,
                '!text-primary': isCurrentRoute,
              }
            )}
            onClick={() => {
              if (item.path) goToRoute(item.path);
              if (item.action) item.action();
            }}
          >
            <span className="h-[25px] aspect-square flex items-center">
              <Icon size="100%" />
            </span>
            {open && (
              <motion.p
                animate={{ opacity: [0, 1], y: [5, 0], scale: [0.8, 1] }}
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
