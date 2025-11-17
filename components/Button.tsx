import React from "react";

export const Button: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement>
> = ({ children, className, onClick, ...props }) => {
  return (
    <button
      className={`bg-[#5C8607] hover:bg-[#4a6b05] text-white font-semibold text-base px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed h-fit transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 ${className}`}
      onClick={props.disabled ? undefined : onClick}
      {...props}
    >
      {children}
    </button>
  );
};
