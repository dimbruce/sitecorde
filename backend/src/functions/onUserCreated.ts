import { getAuth } from "firebase-admin/auth";
import { auth } from "firebase-functions/v1";

export const onUserCreated = auth.user().onCreate(async (user) => {
  await getAuth().setCustomUserClaims(user.uid, { role: "Project Manager" });
});
