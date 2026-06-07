import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useLocation, useOutlet } from 'react-router';
import { springs, variants } from '@/lib/animations';
import { getMyBoTeam, isRunningInElectron } from '@/lib/myboteam';

function AnimatedOutlet() {
  const outlet = useOutlet();
  const [frozenOutlet] = useState(outlet);
  return frozenOutlet;
}

export function AnimatedOutletWrapper() {
  const location = useLocation();

  useEffect(() => {
    if (isRunningInElectron()) {
      try {
        getMyBoTeam()
          .analytics?.trackPageView(location.pathname)
          .catch(() => {});
      } catch {
        /* not in Electron or analytics unavailable */
      }
    }
  }, [location.pathname]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="h-full"
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants.fadeUp}
        transition={springs.gentle}
      >
        <AnimatedOutlet />
      </motion.div>
    </AnimatePresence>
  );
}
