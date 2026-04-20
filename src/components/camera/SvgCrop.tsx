import { SVGProps } from 'react';

function SvgCrop(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#607d8b"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M8 5v10a1 1 0 001 1h10" />
      <path d="M5 8h10a1 1 0 011 1v10" />
    </svg>
  )
}

export default SvgCrop
