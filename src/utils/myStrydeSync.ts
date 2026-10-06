import { WorkoutLog, UserProfile } from '../types/workout';

const MYSTRYDE_API_URL = 'https://app.mystryde.no/api/sync-activity';

export interface MyStrydeSyncResult {
  success: boolean;
  message: string;
  points?: number;
  activityId?: string;
  alreadyExists?: boolean;
}

/**
 * Test connectivity and verify user name/PIN in MyStryde
 */
export async function testMyStrydeConnection(usernameOrPin: string): Promise<MyStrydeSyncResult> {
  const clean = usernameOrPin.trim();
  if (!clean) {
    return { success: false, message: 'Vennligst oppgi et navn eller PIN-kode.' };
  }

  try {
    const isPin = /^\d+$/.test(clean);
    const payload = {
      userName: isPin ? undefined : clean,
      userPin: isPin ? clean : undefined,
      checkOnly: true,
    };

    const res = await fetch(MYSTRYDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `Koblet til MyStryde som ${data.userName || clean}!`,
      };
    } else {
      return {
        success: false,
        message: data.error || `Fant ingen bruker med navnet '${clean}' i MyStryde.`,
      };
    }
  } catch (err: any) {
    console.error('MyStryde connection test error:', err);
    return {
      success: false,
      message: 'Kunne ikke kontakte MyStryde-serveren. Sjekk internettforbindelsen.',
    };
  }
}

/**
 * Automatically sync a completed workout (strength or run) to MyStryde
 */
export async function syncWorkoutToMyStryde(
  workout: WorkoutLog,
  profile: UserProfile,
  programTitle?: string
): Promise<MyStrydeSyncResult> {
  const targetUser = profile.myStrydeUsername?.trim();
  if (!targetUser) {
    return { success: false, message: 'Ingen MyStryde-bruker konfigurert.' };
  }

  try {
    const isRun = workout.type === 'lop';
    const isPin = /^\d+$/.test(targetUser);

    // Beregn estimert varighet
    let durationMinutes = 45;
    let distanceKm = 0;
    let formattedNote = '';

    if (isRun && workout.runDetails) {
      durationMinutes = workout.runDetails.durationMinutes || 40;
      distanceKm = workout.runDetails.distanceKm || 0;
      const runType = workout.runDetails.runType || 'Løpetur';
      formattedNote = `${runType}: ${distanceKm} km på ${durationMinutes} min`;
      if (workout.notes || workout.runDetails.notes) {
        formattedNote += ` (${workout.notes || workout.runDetails.notes})`;
      }
    } else {
      // Styrkeøkt: oppsummer øvelser og sett
      const typeLabel = workout.type === 'okt-a' ? 'Økt A' : workout.type === 'okt-b' ? 'Økt B' : 'Styrkeøkt';
      const title = programTitle ? `${programTitle} (${typeLabel})` : typeLabel;

      const exerciseSummaries: string[] = [];
      if (workout.exercises && workout.exercises.length > 0) {
        workout.exercises.forEach((ex) => {
          const completedSets = ex.sets?.filter((s) => s.completed) || [];
          if (completedSets.length > 0) {
            const firstSet = completedSets[0];
            const weightStr = firstSet.weightKg ? ` ${firstSet.weightKg}kg` : '';
            exerciseSummaries.push(`${ex.exerciseName} (${completedSets.length}x${firstSet.repsCompleted || 8}${weightStr})`);
          }
        });
      }

      formattedNote = `Fullført ${title} i MyStrength! 💪`;
      if (exerciseSummaries.length > 0) {
        formattedNote += `\n${exerciseSummaries.join(', ')}`;
      }
      if (workout.notes) {
        formattedNote += `\nNotat: ${workout.notes}`;
      }
    }

    const payload = {
      userName: isPin ? undefined : targetUser,
      userPin: isPin ? targetUser : undefined,
      type: isRun ? 'Løpetur' : 'Styrke',
      durationMinutes,
      distanceKm,
      date: workout.date,
      completedAt: workout.completedAt || new Date().toISOString(),
      note: formattedNote,
      source: 'MyStrength',
    };

    const res = await fetch(MYSTRYDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || `Registrert i MyStryde!`,
        points: data.points,
        activityId: data.activityId,
        alreadyExists: data.alreadyExists,
      };
    } else {
      return {
        success: false,
        message: data.error || 'Feil ved synkronisering til MyStryde.',
      };
    }
  } catch (err: any) {
    console.error('MyStryde sync error:', err);
    return {
      success: false,
      message: 'Nettverksfeil under MyStryde-synkronisering.',
    };
  }
}

/**
 * Automatically delete an activity in MyStryde if deleted in MyStrength
 */
export async function deleteWorkoutFromMyStryde(
  workout: WorkoutLog,
  profile: UserProfile
): Promise<MyStrydeSyncResult> {
  const targetUser = profile.myStrydeUsername?.trim();
  if (!targetUser) {
    return { success: false, message: 'Ingen MyStryde-bruker konfigurert.' };
  }

  try {
    const isRun = workout.type === 'lop';
    const isPin = /^\d+$/.test(targetUser);

    const payload = {
      action: 'delete',
      userName: isPin ? undefined : targetUser,
      userPin: isPin ? targetUser : undefined,
      type: isRun ? 'Løpetur' : 'Styrke',
      date: workout.date,
    };

    const res = await fetch(MYSTRYDE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      return {
        success: true,
        message: data.message || 'Slettet fra MyStryde.',
      };
    } else {
      return {
        success: false,
        message: data.error || 'Kunne ikke slette fra MyStryde.',
      };
    }
  } catch (err: any) {
    console.error('MyStryde delete error:', err);
    return {
      success: false,
      message: 'Nettverksfeil under sletting i MyStryde.',
    };
  }
}

