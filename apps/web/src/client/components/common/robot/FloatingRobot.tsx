import type { CSSProperties } from 'react';

import './FloatingRobot.css';

type FloatingRobotParts = {
  shadow: string;
  leftArm: string;
  rightArm: string;
  body: string;
  head: string;
};

export type FloatingRobotProps = {
  className?: string;
  parts?: Partial<FloatingRobotParts>;
  size?: string;
  ariaLabel?: string;
};

const defaultFloatingRobotParts = {
  shadow: 'Shaddow2.png',
  leftArm: 'RightHand2.png',
  rightArm: 'LeftHand2.png',
  body: 'Body2.png',
  head: 'Head2.png',
} satisfies FloatingRobotParts;

export default function FloatingRobot({
  className = '',
  parts = defaultFloatingRobotParts,
  size = 'clamp(220px, 72vmin, 720px)',
  ariaLabel = 'Friendly floating robot waving its hands',
}: FloatingRobotProps) {
  const robotParts = {
    ...defaultFloatingRobotParts,
    ...parts,
  };

  const stageStyle = {
    '--floating-robot-size': size,
  } as CSSProperties;

  return (
    <div
      className={`floating-robot ${className}`.trim()}
      style={stageStyle}
      role="img"
      aria-label={ariaLabel}
    >
      <div className="floating-robot__stage">
        <div className="floating-robot__layer floating-robot__shadow" aria-hidden="true">
          <img src={`/assets/robot/${robotParts.shadow}`} alt="" draggable="false" />
        </div>

        <div className="floating-robot__float" aria-hidden="true">
          <div className="floating-robot__layer floating-robot__arm-left">
            <img src={`/assets/robot/${robotParts.leftArm}`} alt="" draggable="false" />
          </div>
          <div className="floating-robot__layer floating-robot__arm-right">
            <img src={`/assets/robot/${robotParts.rightArm}`} alt="" draggable="false" />
          </div>
          <div className="floating-robot__layer floating-robot__body">
            <img src={`/assets/robot/${robotParts.body}`} alt="" draggable="false" />
          </div>
          <div className="floating-robot__layer floating-robot__head">
            <img src={`/assets/robot/${robotParts.head}`} alt="" draggable="false" />
          </div>
          <div className="floating-robot__face" aria-hidden="true">
            <span className="floating-robot__eye floating-robot__eye--left" />
            <span className="floating-robot__eye floating-robot__eye--right" />
            <span className="floating-robot__mouth" />
          </div>
        </div>
      </div>
    </div>
  );
}
