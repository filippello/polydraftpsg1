'use client';

import type { Event } from '@/types';
import { formatProbability, getTier, getTierColor } from '@/lib/scoring/calculator';

interface EventCardProps {
  event: Event;
  size?: 'sm' | 'md' | 'lg';
  showProbabilities?: boolean;
  className?: string;
}

export function EventCard({
  event,
  size = 'md',
  showProbabilities = true,
  className = '',
}: EventCardProps) {
  const tierA = getTier(event.outcome_a_probability);
  const tierB = getTier(event.outcome_b_probability);
  const colorA = getTierColor(tierA);
  const colorB = getTierColor(tierB);

  const isVsMatch =
    event.outcome_a_label !== 'Yes' && event.outcome_b_label !== 'No';

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4',
  };

  return (
    <div className={`card-pixel ${sizeClasses[size]} ${className}`}>
      {/* Category badge */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs px-2 py-0.5 bg-game-secondary rounded uppercase">
          {event.subcategory || event.category}
        </span>
        {event.is_featured && (
          <span className="text-xs text-game-gold">★</span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm mb-3">{event.title}</h3>

      {/* Outcomes */}
      {isVsMatch ? (
        // VS style display
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 text-center">
            <p className="font-bold text-sm">{event.outcome_a_label}</p>
            {showProbabilities && (
              <p className="text-xs" style={{ color: colorA }}>
                {formatProbability(event.outcome_a_probability)}
              </p>
            )}
          </div>
          <span className="text-xs text-gray-500 font-bold">VS</span>
          <div className="flex-1 text-center">
            <p className="font-bold text-sm">{event.outcome_b_label}</p>
            {showProbabilities && (
              <p className="text-xs" style={{ color: colorB }}>
                {formatProbability(event.outcome_b_probability)}
              </p>
            )}
          </div>
        </div>
      ) : (
        // Yes/No style display
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-green-500 font-bold">Yes</span>
            {showProbabilities && (
              <span className="text-xs" style={{ color: colorA }}>
                {formatProbability(event.outcome_a_probability)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold">No</span>
            {showProbabilities && (
              <span className="text-xs" style={{ color: colorB }}>
                {formatProbability(event.outcome_b_probability)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Status indicator */}
      <div className="mt-2 flex items-center gap-1">
        <div
          className={`w-2 h-2 rounded-full ${
            event.status === 'active'
              ? 'bg-green-500'
              : event.status === 'resolved'
                ? 'bg-gray-500'
                : 'bg-yellow-500'
          }`}
        />
        <span className="text-xs text-gray-500 capitalize">{event.status}</span>
      </div>
    </div>
  );
}
