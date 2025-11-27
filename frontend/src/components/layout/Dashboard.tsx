import React, { useState } from 'react';

import dark from '../../../public/logos/zetaconfluence_logo_clear_dark.svg';
import light from '../../../public/logos/zetaconfluence_logo_clear_light.svg';
import { useTheme } from '../../hooks/useTheme';
import { ConnectWallet } from '../ConnectWallet';
import { ThemeToggle } from '../ThemeToggle';
import SideNav from './SideNav';

interface Props extends React.PropsWithChildren {
  children: React.ReactElement;
}

const Dashboard: React.FC<Props> = ({ children }) => {
  const [sideNavOpen, setSideNavOpen] = useState<boolean>(false);
  const { theme } = useTheme();
  return (
    <div className="w-full h-[100dvh] flex flex-col overflow-hidden font-poppins bg-background_light dark:bg-background_dark-tint  text-gray-800 dark:text-gray-400">
      <div className="bg-transparent pt-4 pb-1 px-4 flex items-center w-full h-[8dvh]">
        <div className="h-full w-auto mr-auto flex items-center">
          <img
            src={theme === 'dark' ? dark : light}
            className="h-full object-cover w-auto"
            alt="logo"
          />
        </div>
        <div className="h-full w-auto mr-2">
          <ConnectWallet />
        </div>
        <div className="h-full w-auto aspect-square cursor-pointer ">
          <ThemeToggle />
        </div>
      </div>
      <div className="w-full h-auto flex-1 overflow-y-hidden flex items-center justify-between pl-4 pr-0 py-2">
        <div className={'h-full py-2 relative w-auto'}>
          <SideNav open={sideNavOpen} setOpen={setSideNavOpen} />
        </div>
        <div className="h-full w-auto overflow-hidden flex items-center justify-center flex-1 p-2">
          {children}
        </div>
      </div>
      <div className=" w-full bg-primary px-4 flex items-center bottom-0 h-4">
        here
      </div>
    </div>
  );
};

export default Dashboard;
