import React, { useEffect, useState } from 'react';
import { FireIcon, DocumentTextIcon, StarIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { useSession } from 'next-auth/react';

interface UserStatsProps {
  className?: string;
}

interface UserStats {
  promptsRun: number;
  promptsCreated: number;
  likesReceived: number;
}

// Level thresholds - total points needed for each level
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  20,     // Level 2
  50,     // Level 3
  100,    // Level 4
  200,    // Level 5
  500,    // Level 6
  1000,   // Level 7
  2000,   // Level 8
  5000,   // Level 9
  10000   // Level 10
];

// Default stats for when API fails
const DEFAULT_STATS: UserStats = {
  promptsRun: 0,
  promptsCreated: 0,
  likesReceived: 0
};

export default function UserStats({ className = '' }: UserStatsProps) {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [level, setLevel] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      // Only fetch stats if user is authenticated
      if (status !== 'authenticated') {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/user/stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          
          // Calculate total points and determine level
          const totalPoints = 
            data.promptsRun + 
            (data.promptsCreated * 5) + 
            (data.likesReceived * 3);
          
          // Find the current level
          let userLevel = 1;
          for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
            if (totalPoints >= LEVEL_THRESHOLDS[i]) {
              userLevel = i + 1;
            } else {
              break;
            }
          }
          
          setLevel(userLevel);
          
          // Calculate progress to next level
          if (userLevel < LEVEL_THRESHOLDS.length) {
            const currentLevelPoints = LEVEL_THRESHOLDS[userLevel - 1];
            const nextLevelPoints = LEVEL_THRESHOLDS[userLevel];
            const pointsNeeded = nextLevelPoints - currentLevelPoints;
            const pointsEarned = totalPoints - currentLevelPoints;
            const progressPercent = Math.min(100, Math.floor((pointsEarned / pointsNeeded) * 100));
            setProgress(progressPercent);
          } else {
            setProgress(100); // Max level
          }
        } else {
          console.error('Failed to fetch user stats:', response.status);
          const errorData = await response.json().catch(() => ({}));
          setError(errorData.error || `Failed with status ${response.status}`);
          // Use default stats
          setStats(DEFAULT_STATS);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setError('Network error when fetching stats');
        // Use default stats
        setStats(DEFAULT_STATS);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [status]);

  // If user is not authenticated, don't show stats
  if (status !== 'authenticated') {
    return null;
  }

  if (loading) {
    return (
      <div className={`flex justify-center items-center space-x-2 ${className}`}>
        <div className="animate-pulse h-5 w-24 bg-blue-200 rounded"></div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="flex justify-center items-center space-x-4 mb-1">
        <div className="flex items-center space-x-1 bg-blue-800 bg-opacity-30 px-3 py-1 rounded-lg group relative">
          <FireIcon className="h-5 w-5 text-orange-400" />
          <span className="text-sm font-bold text-white">{stats.promptsRun}</span>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
            Prompts Run
          </div>
        </div>
        
        <div className="flex items-center space-x-1 bg-blue-800 bg-opacity-30 px-3 py-1 rounded-lg group relative">
          <StarIcon className="h-5 w-5 text-yellow-400" />
          <span className="text-sm font-bold text-white">{stats.likesReceived}</span>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
            Favorites Received
          </div>
        </div>
        
        <div className="flex items-center space-x-1 bg-blue-800 bg-opacity-30 px-3 py-1 rounded-lg group relative">
          <DocumentTextIcon className="h-5 w-5 text-green-400" />
          <span className="text-sm font-bold text-white">{stats.promptsCreated}</span>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
            Prompts Created
          </div>
        </div>
      </div>
      
      {/* Level indicator */}
      <div className="flex items-center group relative">
        <TrophyIcon className="h-4 w-4 text-yellow-300 mr-1" />
        <span className="text-xs font-bold text-white">Level {level}</span>
        <div className="ml-2 h-1 w-16 bg-gray-600 rounded-full overflow-hidden">
          <div 
            className="h-full bg-yellow-400 rounded-full" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10">
          {level < LEVEL_THRESHOLDS.length ? `${progress}% to Level ${level+1}` : 'Max Level!'}
        </div>
      </div>
    </div>
  );
} 