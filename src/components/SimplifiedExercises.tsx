import React from 'react';
import { ModuleExercisesEnhanced } from './ModuleExercisesEnhanced';

interface SimplifiedExercisesProps {
  moduleNumber: string;
}

export function SimplifiedExercises({ moduleNumber }: SimplifiedExercisesProps) {
  const moduleNum = parseInt(moduleNumber);
  if (!moduleNum) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Exercises coming soon.</p>
      </div>
    );
  }
  return <ModuleExercisesEnhanced moduleNumber={moduleNum} />;
}

export default SimplifiedExercises;