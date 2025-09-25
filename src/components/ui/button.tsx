import * as React from "react";
import Link from "next/link";
import styles from "./Button.module.css";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, asChild = false, href, ...props }, ref) => {
    
    if (asChild && href) {
      return (
        <Link href={href} className={`${styles.button} ${className || ''}`}>
          {props.children}
        </Link>
      );
    }
    
    return (
      <button
        className={`${styles.button} ${className || ''}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };