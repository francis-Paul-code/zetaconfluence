import React from 'react';
import { useNavigate } from 'react-router';

import { Button } from '../Button';

interface Props extends React.PropsWithChildren {
  children: React.ReactElement;
}
const Main: React.FC<Props> = ({ children }) => {
  const navigate = useNavigate();

  const goToMarkets = () => navigate('/markets')
  return (
    <div className="w-full h-auto min-h-[100dvh] flex flex-col items-center ">
      <div className="w-full h-auto flex items-center justify-between">
        <div className=" ml-3 h-fit w-auto flex">
          <span className="text-lg font-bold font-roboto ">ZetaConfluence</span>
        </div>
        <div className="h-auto w-auto flex-1 flex flex-end">
          <Button onClick={goToMarkets}>Markets</Button>
        </div>
      </div>
      <div className="w-full h-auto flex-1">{children}</div>
    </div>
  );
};

export default Main;
