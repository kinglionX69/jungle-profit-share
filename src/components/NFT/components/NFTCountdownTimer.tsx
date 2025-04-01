
import React, { useState, useEffect } from 'react';

interface NFTCountdownTimerProps {
  unlockDate?: Date;
}

const NFTCountdownTimer: React.FC<NFTCountdownTimerProps> = ({ unlockDate }) => {
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  
  useEffect(() => {
    if (!unlockDate) {
      setTimeRemaining('Unknown');
      return;
    }
    
    const calculateTimeRemaining = () => {
      const now = new Date();
      const unlockTime = new Date(unlockDate);
      
      // If the unlock date is in the past, it's already available
      if (unlockTime <= now) {
        setTimeRemaining('Available Now');
        return;
      }
      
      // Calculate remaining time
      const totalSeconds = Math.floor((unlockTime.getTime() - now.getTime()) / 1000);
      
      if (totalSeconds <= 0) {
        setTimeRemaining('Available Now');
        return;
      }
      
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };
    
    // Calculate immediately
    calculateTimeRemaining();
    
    // Update every minute
    const interval = setInterval(calculateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [unlockDate]);
  
  return (
    <div className="text-amber-500 font-medium flex items-center">
      <span className="inline-block w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
      Claimed - {timeRemaining}
    </div>
  );
};

export default NFTCountdownTimer;
