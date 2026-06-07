import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { getMyBoTeam, isRunningInElectron } from '@/config/myboteam';
import { AnimatedOutlet } from '@/pages/conversation/AnimatedOutlet';
import { springs, variants } from '@/utils/animations';

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
