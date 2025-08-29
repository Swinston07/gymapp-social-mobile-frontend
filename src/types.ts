export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
}

export type AppStackParamList = {
  // Login: undefined;
  // Register: undefined;
  UserProfile: { id: number };
  Onboarding: { id: number };
  EditProfile: { id: number };
  PhotoUpload: { id: number };
  ViewUserProfile: { id: number };
  SetHomeGym: {id: number};
  Matches: { id: number };
  GymBuddies: { id: number };
  Chat: { id: number; buddyId: number };
  ScheduleWorkout: { id: number; buddyId: number };
  ScheduledSessions: { id: number };
  PendingInvites: { id: number };
  ProgressForm: { id: number };
  ProgressChart: { id: number };
  Dashboard: { id: number };
  DeleteAccount: {id: number};
};

export type RootStackParamList = AuthStackParamList & AppStackParamList;