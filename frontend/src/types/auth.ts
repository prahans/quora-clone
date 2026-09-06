export type CurrentUser = {
  id: string;
  username: string;
  email: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type SignupInput = LoginInput & {
  username: string;
};
