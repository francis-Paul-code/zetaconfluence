import React from 'react';

interface Props extends React.PropsWithChildren {
  children: React.ReactElement;
}
const Main: React.FC<Props> = ({ children }) => {
  return (
    <div className="w-full h-auto min-h-[100dvh] flex flex-col items-center ">
      <div className="w-full h-auto flex items-center justify-between">
        <div className=" ml-3 h-fit w-auto flex">
          <span className="text-lg font-bold font-roboto ">ZetaConfluence</span>
        </div>
      </div>
      <div className="w-full h-auto flex-1">{children}</div>
    </div>
  );
};

export default Main;
