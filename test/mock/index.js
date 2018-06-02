export default {
  team1: {
    name: 'team1',
    description: 'description of team1',
    photo: 'https://www.myphotos.com/1',
  },
  team2: {
    name: 'team2',
    description: 'description of team2',
    photo: 'https://www.myphotos.com/2',
    private: true,
    progress: 50
  },
  team3: {
    name: 'team3',
    description: 'description of team3',
    photo: 'https://www.myphotos.com/3',
  },
  team4: {
    name: 'team4',
    description: 'description of team4',
    photo: 'https://www.myphotos.com/4',
  },
  team5: {
    name: 'team5',
    description: 'description of team5',
    photo: 'https://www.myphotos.com/5',
  },
  team1WithoutOptionalProperties: {
    name: 'team1'
  },
  team2WithoutOptionalProperties: {
    name: 'team2'
  },
  team1WithoutName: {
    description: 'description of team1',
    photo: 'https://www.myphotos.com/1',
  },
  user0: {
    displayName: 'user0',
    email: 'user0@gmail.com',
    facebookId: 123450,
    googleId: 123450,
    password: 'password0',
    photo: 'https://www.myphotos.com/0',
    role: 'admin',
  },
  user1: {
    displayName: 'user1',
    email: 'user1@gmail.com',
    password: 'password1',
    photo: 'https://www.myphotos.com/1',
  },
  user2: {
    displayName: 'user2',
    email: 'user2@gmail.com',
    googleId: 123452,
    photo: 'https://www.myphotos.com/2',
  },
  user3: {
    displayName: 'user3',
    email: 'user3@gmail.com',
    facebookId: 123453,
    photo: 'https://www.myphotos.com/3',
  },
  user4: {
    displayName: 'user4',
    email: 'user4@gmail.com',
    githubUsername: 'user4',
    googleId: 123454,
    photo: 'https://www.myphotos.com/4',
  },
  user5: {
    displayName: 'user5',
    email: 'user5@gmail.com',
    githubUsername: 'user5',
    googleId: 123455,
    photo: 'https://www.myphotos.com/5',
  },
  user1WithNonAndelaEmail: {
    displayName: 'user1',
    email: 'user1@email.com',
    githubUsername: 'user1',
    googleId: 12345,
    photo: 'https://www.myphotos.com/1',
  },
  user1WithMalformedEmail: {
    displayName: 'user1',
    email: 'user1@gmailcom',
    password: 'password1',
    photo: 'https://www.myphotos.com/1',
  },
  user2WithMalformedEmail: {
    displayName: 'user2',
    email: 'user2gmail.com',
    googleId: 123452,
    photo: 'https://www.myphotos.com/2',
  },
  user3WithMalformedEmail: {
    displayName: 'user3',
    email: 'user3@gmail.',
    facebookId: 123453,
    photo: 'https://www.myphotos.com/3',
  },
  user1WithoutDisplayName: {
    email: 'user1@gmail.com',
    password: 'password1',
    photo: 'https://www.myphotos.com/1',
  },
  user1WithoutEmail: {
    displayName: 'user1',
    password: 'password1',
    photo: 'https://www.myphotos.com/1',
  },
  user1WithoutPassword: {
    displayName: 'user1',
    email: 'user1@gmail.com',
    photo: 'https://www.myphotos.com/1',
  },
};
