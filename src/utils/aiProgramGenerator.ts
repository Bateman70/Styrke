import { UserProfile, WorkoutProgram, WorkoutType, Exercise } from '../types/workout';
import { WORKOUT_PROGRAMS as DEFAULT_PROGRAMS } from '../data/workoutProgramData';

export function generateAIWorkoutPrograms(profile: UserProfile): Record<'okt-a' | 'okt-b' | 'fri-okt', WorkoutProgram> {
  const { age, gender, weightKg, goal, experience } = profile;

  const isOlder = age >= 50;
  const isBeginner = experience === 'nybegynner';

  // Determine rep scheme & sets based on age/experience
  const mainReps = isOlder || isBeginner ? '10–12' : '6–8';
  const superReps = isOlder || isBeginner ? '12–15' : '8–10';
  const mainSets = isBeginner ? 2 : 3;
  const restSec = isOlder ? 90 : 60;

  // 1. Goal: Løping & Styrke (Runners)
  if (goal === 'lopere') {
    const oktA: WorkoutProgram = {
      id: 'okt-a',
      title: `Økt A — Løpestyrke & Stabilitet (${age} år)`,
      subtitle: `Tilpasset ${gender === 'mann' ? 'mann' : gender === 'kvinne' ? 'kvinne' : 'løper'}, ${weightKg} kg (${experience})`,
      estimatedTime: '45–50 minutter',
      focusAreas: ['Skadeforebygging', 'Akilles & Legger', 'Kjerne & Hoftestabilitet'],
      exercises: [
        {
          id: 'goblet-squat',
          name: 'Goblet Squat (Knebøy m/ Vekt)',
          category: 'Main',
          groupLabel: 'Hovedøvelse',
          defaultSets: mainSets,
          defaultReps: mainReps,
          restSeconds: restSec,
          focus: isOlder ? 'Fokusér på dyp knebøy med kontrollert tempo og ryggen rett.' : 'Gå dypt, ta vare på knærne og press opp gjennom hælene.',
          videoUrl: 'https://www.youtube.com/embed/MeIiIdhvKL4',
          videoTitle: 'Goblet Squat teknikk',
        },
        {
          id: 'rumensk-markloft',
          name: 'Rumensk Markløft',
          category: 'Main',
          groupLabel: 'Hovedøvelse',
          defaultSets: mainSets,
          defaultReps: mainReps,
          restSeconds: restSec,
          focus: 'Styrker hamstrings og setemuskulatur for bedre løpesteg. Skyv hofta bakover.',
          videoUrl: 'https://www.youtube.com/embed/JCXUYuzw420',
          videoTitle: 'Rumensk Markløft teknikk',
        },
        {
          id: 'staende-legghev',
          name: 'Stående Legghev (Ett ben)',
          category: 'Superset 1',
          groupLabel: 'Legg & Akilles',
          defaultSets: 3,
          defaultReps: '12–15',
          restSeconds: 45,
          focus: 'Ett ben om gangen. Senk hælen rolig ned og press helt opp på tå. Forebygger akillesbetennelse.',
          isPerSide: true,
        },
        {
          id: 'sideplanke',
          name: 'Sideplanke m/ Hev',
          category: 'Superset 1',
          groupLabel: 'Kjerne & Hofte',
          defaultSets: 3,
          defaultReps: '30–45 sek',
          restSeconds: 45,
          focus: 'Hold hoften høy og kroppen rett. Styrker gluteus medius for stabil løpeteknikk.',
          isPerSide: true,
        },
      ],
    };

    const oktB: WorkoutProgram = {
      id: 'okt-b',
      title: `Økt B — Ettbensstyrke & Kjerne (${age} år)`,
      subtitle: `Tilpasset ${gender === 'mann' ? 'mann' : gender === 'kvinne' ? 'kvinne' : 'løper'}, ${weightKg} kg (${experience})`,
      estimatedTime: '45–50 minutter',
      focusAreas: ['Ettbensbalanse', 'Lår & Sete', 'Overkropp & Holdning'],
      exercises: [
        {
          id: 'bulgarsk-utfall',
          name: 'Bulgarsk Utfall (Split Squat)',
          category: 'Main',
          groupLabel: 'Ettbens øvelse',
          defaultSets: mainSets,
          defaultReps: superReps,
          restSeconds: restSec,
          focus: 'Bakre fot på benk/stol. Senk hoften rett ned. Styrker hvert ben uavhengig for jevn løpekraft.',
          isPerSide: true,
        },
        {
          id: 'pushups-chins',
          name: gender === 'kvinne' ? 'Push-ups (Armhevinger)' : 'Chins / Pull-ups',
          category: 'Main',
          groupLabel: 'Overkropp',
          defaultSets: 3,
          defaultReps: isBeginner ? '8–10' : '6–10',
          restSeconds: restSec,
          focus: 'Styrker rygg og skuldre for god holdning gjennom lange løpeturer.',
        },
        {
          id: 'hip-thrust',
          name: 'Hip Thrust (Seteløft)',
          category: 'Superset 2',
          groupLabel: 'Setemuskulatur',
          defaultSets: 3,
          defaultReps: superReps,
          restSeconds: 60,
          focus: 'Skuldre mot benk eller gulv. Klem sammen setet på toppen i 2 sekunder.',
        },
        {
          id: 'planke-rotation',
          name: 'Planke med Rrotasjon',
          category: 'Superset 2',
          groupLabel: 'Kjerne',
          defaultSets: 3,
          defaultReps: '10 per side',
          restSeconds: 45,
          focus: 'Stram magen og roter kontrollert. Gir rotasjonsstabilitet under løp.',
        },
      ],
    };

    return { ...DEFAULT_PROGRAMS, 'okt-a': oktA, 'okt-b': oktB };
  }

  // 2. Goal: Generell Helse & Hverdagsstyrke
  if (goal === 'helse_styrke') {
    const oktA: WorkoutProgram = {
      id: 'okt-a',
      title: `Økt A — Funksjonell Helse & Rygg (${age} år)`,
      subtitle: `Generell helse & styrke • ${experience}`,
      estimatedTime: '40–45 minutter',
      focusAreas: ['Rygghelse', 'Holdning', 'Helkroppsstyrke'],
      exercises: [
        {
          id: 'goblet-squat',
          name: 'Knebøy m/ Hantel (Goblet)',
          category: 'Main',
          groupLabel: 'Underkropp',
          defaultSets: mainSets,
          defaultReps: '10–12',
          restSeconds: restSec,
          focus: 'Hold vekten inntil brystet. God dyp knebøy som styrker lårene og hoftene for hverdagen.',
          videoUrl: 'https://www.youtube.com/embed/MeIiIdhvKL4',
        },
        {
          id: 'sittende-roing',
          name: 'Sittende Roing (Strikk/Apparat)',
          category: 'Main',
          groupLabel: 'Rygg & Holdning',
          defaultSets: 3,
          defaultReps: '10–12',
          restSeconds: 60,
          focus: 'Trekk skulderbladene godt sammen. Motvirker kontorrygg og gir god holdning.',
        },
        {
          id: 'glute-bridge',
          name: 'Glute Bridge (Hoftehev på gulv)',
          category: 'Superset 1',
          groupLabel: 'Sete & Korsrygg',
          defaultSets: 3,
          defaultReps: '12–15',
          restSeconds: 45,
          focus: 'Skyt hoften i været og stram setemuskulaturen på toppen.',
        },
        {
          id: 'kjerne-planke',
          name: 'Klassisk Planke',
          category: 'Superset 1',
          groupLabel: 'Kjerne',
          defaultSets: 3,
          defaultReps: '30–45 sek',
          restSeconds: 45,
          focus: 'Hold kroppen som en rett linje. Ikke la korsryggen henge ned.',
        },
      ],
    };

    const oktB: WorkoutProgram = {
      id: 'okt-b',
      title: `Økt B — Skuldre, Ben & Stabilitet (${age} år)`,
      subtitle: `Generell helse & styrke • ${experience}`,
      estimatedTime: '40–45 minutter',
      focusAreas: ['Skuldre', 'Benstyrke', 'Balanse'],
      exercises: [
        {
          id: 'utfall-gaende',
          name: 'Gående Utfall',
          category: 'Main',
          groupLabel: 'Ben & Balanse',
          defaultSets: mainSets,
          defaultReps: '10 per ben',
          restSeconds: restSec,
          focus: 'Ta kontrollerte steg framover. Senk kneet mot gulvet.',
          isPerSide: true,
        },
        {
          id: 'skulderpress-hantel',
          name: 'Skulderpress m/ Hantler',
          category: 'Main',
          groupLabel: 'Skuldre',
          defaultSets: 3,
          defaultReps: '10–12',
          restSeconds: 60,
          focus: 'Press vektene opp over hodet med kontroll. Senk rolig ned til brysthøyde.',
        },
        {
          id: 'staende-legghev',
          name: 'Stående Legghev',
          category: 'Superset 2',
          groupLabel: 'Legger',
          defaultSets: 3,
          defaultReps: '15',
          restSeconds: 45,
          focus: 'Press helt opp på tåballene for å styrke anklene.',
        },
        {
          id: 'fuglehund-kjerne',
          name: 'Fuglehund (Bird-Dog)',
          category: 'Superset 2',
          groupLabel: 'Ryggstabilitet',
          defaultSets: 3,
          defaultReps: '10 per side',
          restSeconds: 45,
          focus: 'Strek ut motsatt arm og ben parallelt med gulvet. Supert for korsryggen.',
          isPerSide: true,
        },
      ],
    };

    return { ...DEFAULT_PROGRAMS, 'okt-a': oktA, 'okt-b': oktB };
  }

  // 3. Goal: Muskelvekst & Styrke
  if (goal === 'muskelvekst') {
    const oktA: WorkoutProgram = {
      id: 'okt-a',
      title: `Økt A — Bryst, Rygg & Ben (${age} år)`,
      subtitle: `Muskelvekst & Styrke • ${experience}`,
      estimatedTime: '50–55 minutter',
      focusAreas: ['Bryst', 'Ryggbredde', 'Lårstyrke'],
      exercises: [
        {
          id: 'hantelpress-bryst',
          name: 'Brystpress m/ Hantler (Benk)',
          category: 'Main',
          groupLabel: 'Bryst & Triceps',
          defaultSets: 3,
          defaultReps: '8–10',
          restSeconds: 90,
          focus: 'Kontrollert senking til brystkassen. Eksplosivt press opp.',
        },
        {
          id: 'goblet-squat-tung',
          name: 'Tung Goblet Squat / Knebøy',
          category: 'Main',
          groupLabel: 'Lår & Sete',
          defaultSets: 3,
          defaultReps: '8–10',
          restSeconds: 90,
          focus: 'Press gjennom hele foten. Bygger lårmuskulatur og grunnstyrke.',
          videoUrl: 'https://www.youtube.com/embed/MeIiIdhvKL4',
        },
        {
          id: 'bent-over-row',
          name: 'Fremoverbøyd Roing m/ Hantler',
          category: 'Superset 1',
          groupLabel: 'Rygg',
          defaultSets: 3,
          defaultReps: '10–12',
          restSeconds: 60,
          focus: 'Bøy i hofta, rett rygg. Trekk albuene opp og bakover.',
        },
        {
          id: 'biceps-curl',
          name: 'Biceps Curl m/ Hantler',
          category: 'Superset 1',
          groupLabel: 'Armer',
          defaultSets: 3,
          defaultReps: '10–12',
          restSeconds: 60,
          focus: 'Hold albuene inntil siden. Klem sammen biceps på toppen.',
        },
      ],
    };

    const oktB: WorkoutProgram = {
      id: 'okt-b',
      title: `Økt B — Skuldre, Hamstrings & Triceps (${age} år)`,
      subtitle: `Muskelvekst & Styrke • ${experience}`,
      estimatedTime: '50–55 minutter',
      focusAreas: ['Skuldre', 'Hamstrings', 'Armer & Kjerne'],
      exercises: [
        {
          id: 'rumensk-markloft-tung',
          name: 'Rumensk Markløft m/ Hantler',
          category: 'Main',
          groupLabel: 'Hamstrings',
          defaultSets: 3,
          defaultReps: '8–10',
          restSeconds: 90,
          focus: 'Strekk på hamstrings i bunnen. Press hoften fram for full kontraksjon.',
          videoUrl: 'https://www.youtube.com/embed/JCXUYuzw420',
        },
        {
          id: 'skulderpress-staende',
          name: 'Stående Skulderpress',
          category: 'Main',
          groupLabel: 'Skuldre',
          defaultSets: 3,
          defaultReps: '8–10',
          restSeconds: 90,
          focus: 'Stram magen og press vektene opp over hodet.',
        },
        {
          id: 'bulgarsk-utfall',
          name: 'Bulgarsk Utfall',
          category: 'Superset 2',
          groupLabel: 'Sete & Lår',
          defaultSets: 3,
          defaultReps: '10 per ben',
          restSeconds: 60,
          focus: 'Fokus på full stretch i gluteus.',
          isPerSide: true,
        },
        {
          id: 'triceps-dips',
          name: 'Triceps Dips (på benk)',
          category: 'Superset 2',
          groupLabel: 'Triceps',
          defaultSets: 3,
          defaultReps: '10–12',
          restSeconds: 60,
          focus: 'Senk kroppen til 90 grader i albuen og press opp.',
        },
      ],
    };

    return { ...DEFAULT_PROGRAMS, 'okt-a': oktA, 'okt-b': oktB };
  }

  // 4. Goal: Vektnedgang & Kondisjonsstyrke
  const oktA: WorkoutProgram = {
    id: 'okt-a',
    title: `Økt A — Høy Puls & Forbrenning (${age} år)`,
    subtitle: `Vektnedgang & Kondisjonsstyrke • ${experience}`,
    estimatedTime: '35–40 minutter',
    focusAreas: ['Forbrenning', 'Helkropps-tempo', 'Kjerne'],
    exercises: [
      {
        id: 'kettlebell-swing',
        name: 'Kettlebell Swings / Hantelsving',
        category: 'Main',
        groupLabel: 'Puls & Hoftesving',
        defaultSets: 4,
        defaultReps: '15–20',
        restSeconds: 45,
        focus: 'Eksplosiv hoftestøt! Få pulsen opp og stram setemuskulaturen.',
      },
      {
        id: 'squat-thruster',
        name: 'Dumbbell Thrusters (Knebøy + Press)',
        category: 'Main',
        groupLabel: 'Helkropp',
        defaultSets: 3,
        defaultReps: '12',
        restSeconds: 60,
        focus: 'Gå ned i knebøy og press vekten rett opp over hodet i én bevegelse.',
      },
      {
        id: 'mountain-climbers',
        name: 'Mountain Climbers',
        category: 'Superset 1',
        groupLabel: 'Puls & Kjerne',
        defaultSets: 3,
        defaultReps: '40 sek',
        restSeconds: 30,
        focus: 'Plankeposisjon. Trekk knærne mot brystet i et raskt tempo.',
      },
      {
        id: 'sideplanke',
        name: 'Sideplanke',
        category: 'Superset 1',
        groupLabel: 'Kjerne',
        defaultSets: 3,
        defaultReps: '30 sek',
        restSeconds: 30,
        focus: 'Stram magen og hold hofta oppe.',
        isPerSide: true,
      },
    ],
  };

  const oktB: WorkoutProgram = {
    id: 'okt-b',
    title: `Økt B — Utfall, Push-ups & Kjerne-intervall (${age} år)`,
    subtitle: `Vektnedgang & Kondisjonsstyrke • ${experience}`,
    estimatedTime: '35–40 minutter',
    focusAreas: ['Utholdenhet', 'Overkropp & Ben', 'Høy Puls'],
    exercises: [
      {
        id: 'utfall-gaende-puls',
        name: 'Gående Utfall m/ Lett Vekt',
        category: 'Main',
        groupLabel: 'Ben & Puls',
        defaultSets: 3,
        defaultReps: '12 per ben',
        restSeconds: 45,
        focus: 'Gå i et jevnt, friskt tempo for å holde pulsen oppe.',
        isPerSide: true,
      },
      {
        id: 'pushups-dynamisk',
        name: 'Push-ups (Armhevinger)',
        category: 'Main',
        groupLabel: 'Overkropp',
        defaultSets: 3,
        defaultReps: '10–12',
        restSeconds: 45,
        focus: 'Gjør på knærne eller tærne med godt tempo.',
      },
      {
        id: 'step-ups',
        name: 'Step-ups på stol/kasse',
        category: 'Superset 2',
        groupLabel: 'Legs & Heart',
        defaultSets: 3,
        defaultReps: '12 per ben',
        restSeconds: 30,
        focus: 'Trå opp med kraft og senk rolig ned.',
        isPerSide: true,
      },
      {
        id: 'planke-jacking',
        name: 'Planke m/ Benåpning',
        category: 'Superset 2',
        groupLabel: 'Kjerne',
        defaultSets: 3,
        defaultReps: '45 sek',
        restSeconds: 30,
        focus: 'Hold magen stram mens føttene hopper ut og inn.',
      },
    ],
  };

  return { ...DEFAULT_PROGRAMS, 'okt-a': oktA, 'okt-b': oktB };
}
