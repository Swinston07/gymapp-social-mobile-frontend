export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
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
};