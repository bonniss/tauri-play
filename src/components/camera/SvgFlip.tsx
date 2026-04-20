import { SVGProps } from 'react';

function SvgFlip(props: SVGProps<SVGSVGElement>) {
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
      <path d="M12 3v18M16 7v10h5L16 7M8 7v10H3L8 7" />
    </svg>
  );
}

export default SvgFlip;
