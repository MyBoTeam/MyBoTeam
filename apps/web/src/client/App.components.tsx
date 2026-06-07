import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { springs, variants } from '@/lib/animations';
import { getMyBoTeam, isRunningInElectron } from '@/lib/myboteam';
import { AnimatedOutlet } from './pages/execution/AnimatedOutlet';

export function AnimatedOutletWrapper() {
  const location = useLocation();

  useEffect(() => {
    if (isRunningInElectron()) {
      try {
        getMyBoTeam()
          .analytics?.trackPageView(location.pathname)
          .catch(() => {});
      } catch {}
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
