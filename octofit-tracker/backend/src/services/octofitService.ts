import mongoose from 'mongoose';
import { Activity, Team, User, Workout } from '../models/index.js';

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Activity payload is required'), { status: 400 });
  }

  const record = input as Record<string, unknown>;
  const userId = typeof record.userId === 'string' ? record.userId : undefined;
  const teamId = typeof record.teamId === 'string' ? record.teamId : undefined;
  const type = typeof record.type === 'string' ? record.type.trim() : undefined;
  const minutesValue = Number(record.minutes);

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    throw Object.assign(new Error('userId must be a valid MongoDB id'), { status: 400 });
  }
  if (!teamId || !mongoose.Types.ObjectId.isValid(teamId)) {
    throw Object.assign(new Error('teamId must be a valid MongoDB id'), { status: 400 });
  }
  if (!type || type.length === 0) {
    throw Object.assign(new Error('type is required'), { status: 400 });
  }
  if (!Number.isFinite(minutesValue) || minutesValue <= 0) {
    throw Object.assign(new Error('minutes must be a positive number'), { status: 400 });
  }

  const user = await User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 400 });
  }

  const team = await Team.findById(teamId);
  if (!team) {
    throw Object.assign(new Error('Team not found'), { status: 400 });
  }

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type,
    minutes: minutesValue,
    points: Math.max(1, Math.round(minutesValue * 1.2)),
    occurredAt: new Date(),
  });

  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw Object.assign(new Error('Team payload is required'), { status: 400 });
  }

  const record = input as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : undefined;
  const mascot = typeof record.mascot === 'string' ? record.mascot.trim() : undefined;
  const membersValue = Array.isArray(record.members) ? record.members : [];

  if (!name || name.length === 0) {
    throw Object.assign(new Error('name is required'), { status: 400 });
  }
  if (!mascot || mascot.length === 0) {
    throw Object.assign(new Error('mascot is required'), { status: 400 });
  }

  const memberIds = Array.from(new Set(membersValue.map((member) => {
    const id = typeof member === 'string' ? member : String(member);
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw Object.assign(new Error('members must contain valid MongoDB ids'), { status: 400 });
    }
    return new mongoose.Types.ObjectId(id);
  })));

  const team = await Team.create({ name, mascot, members: memberIds });

  if (memberIds.length > 0) {
    await User.updateMany({ _id: { $in: memberIds } }, { $set: { team: team._id } });
  }

  await Team.updateOne({ _id: team._id }, { $addToSet: { members: { $each: memberIds } } });
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
    { $sort: { totalPoints: -1, _id: 1 } },
  ]);

  if (totals.length === 0) {
    return [];
  }

  const teamIds = totals.map((entry) => entry._id);
  const teams = await Team.find({ _id: { $in: teamIds } }).lean();
  const teamNames = new Map(teams.map((team) => [team._id.toString(), team.name]));

  return totals.map((entry, index) => ({
    teamName: teamNames.get(entry._id.toString()) ?? 'Unknown team',
    totalPoints: entry.totalPoints,
    rank: index + 1,
  }));
}

export async function suggestWorkouts(userEmail: string) {
  const normalizedEmail = userEmail.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw Object.assign(new Error('User not found'), { status: 404 });
  }

  const recentActivities = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(5).lean();
  const recentTypes = recentActivities.map((activity) => String(activity.type ?? '').trim().toLowerCase()).filter(Boolean);
  const targetFocus = (user.fitnessGoal ?? '').trim().toLowerCase();
  const workoutPool = await Workout.find().lean();

  const scored = workoutPool
    .map((workout) => {
      const workoutFocus = String(workout.focus ?? '').trim().toLowerCase();
      const workoutTitle = String(workout.title ?? '').trim().toLowerCase();
      let score = 0;

      if (targetFocus && (workoutFocus.includes(targetFocus) || targetFocus.includes(workoutFocus))) {
        score += 3;
      }

      for (const activityType of recentTypes) {
        if (!activityType) continue;
        if (workoutFocus.includes(activityType) || activityType.includes(workoutFocus)) {
          score += 4;
        }
        if (workoutTitle.includes(activityType)) {
          score += 2;
        }
      }

      return { workout, score };
    })
    .sort((left, right) => right.score - left.score || left.workout.title.localeCompare(right.workout.title));

  const suggestions = scored.map(({ workout }) => {
    const focus = String(workout.focus ?? '').trim();
    const reason = recentTypes.length > 0
      ? `Matches your recent ${recentTypes[0]} activity patterns and ${targetFocus || 'fitness'} goals.`
      : `Supports your ${targetFocus || 'fitness'} goals.`;

    return {
      ...workout,
      reason: reason.includes('fitness') || reason.includes(recentTypes[0] ?? '') ? reason : `Supports your recent ${recentTypes[0] ?? 'activity'} pattern.`,
    };
  });

  return suggestions.sort((left, right) => {
    const leftScore = Number((left as any).score ?? 0);
    const rightScore = Number((right as any).score ?? 0);
    return rightScore - leftScore;
  });
}

export { User };
