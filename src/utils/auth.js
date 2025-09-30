export function makeGuest() {
   return {
      username: "guest",
      role: "guest",
      name: "Guest Visitor",
      token: "guest_token_secret_n0t_real"
   };
}

export function rand() {
   return Math.floor(Math.random() * 256);
}