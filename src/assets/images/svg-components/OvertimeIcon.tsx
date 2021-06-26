import * as React from "react";

function OvertimeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={20}
      height={19}
      viewBox="0 0 20 19"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18.654 9.5l.207-.208c.166-.165.166-.331 0-.497l-2.983-2.983c-.166-.166-.332-.166-.497 0l-2.983 2.983c-.166.166-.166.332 0 .497l.207.207c.166.166.331.166.497 0l2.03-2.03c.36 1.105.4 2.224.125 3.356a6.052 6.052 0 01-1.658 2.983c-1.229 1.23-2.707 1.837-4.433 1.823-1.74 0-3.218-.607-4.433-1.823-1.23-1.229-1.844-2.713-1.844-4.454.014-1.726.628-3.197 1.844-4.412 1.132-1.133 2.5-1.74 4.102-1.823.22-.028.331-.152.331-.373v-.29c0-.249-.124-.36-.373-.332-1.864.097-3.453.802-4.765 2.114C2.606 5.66 1.895 7.366 1.895 9.354c0 2.017.71 3.736 2.133 5.159a7.124 7.124 0 003.253 1.885 7.115 7.115 0 003.729 0 6.963 6.963 0 003.273-1.865 7.178 7.178 0 001.906-3.273 7.115 7.115 0 000-3.729L18.157 9.5c.166.166.331.166.497 0zm-7.466 2.395c.195.136.361.107.498-.088l.117-.176c.137-.195.117-.361-.059-.498L9.635 9.609V5.274c0-.235-.117-.352-.352-.352H9.05c-.234 0-.352.117-.352.352v4.804l2.49 1.817z"
        fill="#F31C43"
      />
    </svg>
  );
}

export default OvertimeIcon;
