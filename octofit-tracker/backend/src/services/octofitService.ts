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

export async function createTeam(_input: unknown) {
  throw Object.assign(new Error('Team validation is not implemented yet'), { status: 501 });
}

export async function getLeaderboard() {
  return [];
}

export async function suggestWorkouts(_userEmail: string) {
  return Workout.find().limit(1).lean();
}

export { User };
