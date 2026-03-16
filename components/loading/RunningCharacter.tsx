'use client';

import { useEffect, useRef, useState } from 'react';

interface RunningCharacterProps {
  progress: number; // 0-100
  size?: number;
}

export function RunningCharacter({ progress, size = 40 }: RunningCharacterProps) {
  const [frame, setFrame] = useState(0);
  const animationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const positionX = (progress / 100) * 100; // Percentage of container width

  // 4-frame running animation
  useEffect(() => {
    animationRef.current = setInterval(() => {
      setFrame((prev) => (prev + 1) % 4);
    }, 150);

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, []);

  const getPose = () => {
    switch (frame) {
      case 0: return { legL: -20, legR: 20, armL: 20, armR: -20, bob: 0 };
      case 1: return { legL: 0, legR: 0, armL: 0, armR: 0, bob: -3 };
      case 2: return { legL: 20, legR: -20, armL: -20, armR: 20, bob: 0 };
      case 3: return { legL: 0, legR: 0, armL: 0, armR: 0, bob: -3 };
      default: return { legL: 0, legR: 0, armL: 0, armR: 0, bob: 0 };
    }
  };

  const pose = getPose();
  const isComplete = progress >= 100;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${Math.min(positionX, 95)}%`,
        bottom: 4,
        transform: `translateX(-${size / 2}px)`,
        width: size,
        height: size,
      }}
    >
      {isComplete ? (
        // Celebration pose
        <div style={{ width: size, height: size, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          {/* Head */}
          <div className="w-3 h-3 rounded-full bg-[#00D397]" />
          {/* Body */}
          <div className="w-1 h-4 bg-[#00D397]" />
          {/* Arms up */}
          <div
            className="absolute w-1 h-3 bg-[#00D397]"
            style={{ top: 6, left: 4, transform: 'rotate(-45deg)', transformOrigin: 'top center' }}
          />
          <div
            className="absolute w-1 h-3 bg-[#00D397]"
            style={{ top: 6, right: 4, transform: 'rotate(45deg)', transformOrigin: 'top center' }}
          />
          {/* Jump legs */}
          <div
            className="absolute w-1 h-3 bg-[#00D397]"
            style={{ bottom: 2, left: 6, transform: 'rotate(30deg)', transformOrigin: 'top center' }}
          />
          <div
            className="absolute w-1 h-3 bg-[#00D397]"
            style={{ bottom: 2, right: 6, transform: 'rotate(-30deg)', transformOrigin: 'top center' }}
          />
        </div>
      ) : (
        // Running pose
        <div
          style={{
            width: size,
            height: size,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative',
            transform: `translateY(${pose.bob}px)`,
          }}
        >
          {/* Head */}
          <div className="w-3 h-3 rounded-full bg-[#00D397]" />
          {/* Body */}
          <div className="w-1 h-4 bg-[#00D397]" />
          {/* Left Arm */}
          <div
            className="absolute w-1 h-3 bg-[#00D397]"
            style={{ top: 6, left: 6, transform: `rotate(${pose.armL}deg)`, transformOrigin: 'top center' }}
          />
          {/* Right Arm */}
          <div
            className="absolute w-1 h-3 bg-[#00D397]"
            style={{ top: 6, right: 6, transform: `rotate(${pose.armR}deg)`, transformOrigin: 'top center' }}
          />
          {/* Left Leg */}
          <div
            className="absolute w-1 h-4 bg-[#00D397]"
            style={{ bottom: 4, left: 8, transform: `rotate(${pose.legL}deg)`, transformOrigin: 'top center' }}
          />
          {/* Right Leg */}
          <div
            className="absolute w-1 h-4 bg-[#00D397]"
            style={{ bottom: 4, right: 8, transform: `rotate(${pose.legR}deg)`, transformOrigin: 'top center' }}
          />
        </div>
      )}
    </div>
  );
}
