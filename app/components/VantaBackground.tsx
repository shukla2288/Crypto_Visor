import React, { useEffect, useRef, useState, ReactNode } from "react";
import Script from "next/script";

interface VantaEffect {
  destroy: () => void;
}

interface VANTA {
  DOTS: (options: Record<string, unknown>) => VantaEffect;
}

declare global {
  interface Window {
    VANTA?: VANTA;
  }
}

interface VantaBackgroundProps {
  children: ReactNode;
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ children }) => {
  const [vantaEffect, setVantaEffect] = useState<VantaEffect | null>(null);
  const vantaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadVanta = async () => {
      if (!vantaEffect && window.VANTA) {
        const effect = window.VANTA.DOTS({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: true,
          minHeight: 200.0,
          minWidth: 200.0,
          scale: 1.0,
          scaleMobile: 1.0,
          color2: 0x0,
          backgroundColor: 0x0,
        });

        setVantaEffect(effect);
      }
    };

    loadVanta();

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [vantaEffect]);

  return (
    <div className="relative min-h-screen">
      {/* Background layer */}
      <div
        ref={vantaRef}
        className="fixed inset-0 w-full h-full z-0"
        aria-hidden="true"
      />

      {/* Content layer */}
      <div className="relative z-10">
        {/* Load three.js script */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r121/three.min.js"
          strategy="beforeInteractive"
        />
        {/* Load Vanta.js script */}
        <Script
          src="https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.dots.min.js"
          strategy="beforeInteractive"
          onLoad={() => {
            console.log("Vanta.js loaded");
          }}
        />
        {children}
      </div>
    </div>
  );
};

export default VantaBackground;
