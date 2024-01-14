const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");

// The Firebase Admin SDK to access Firestore.
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { getMessaging } = require("firebase-admin/messaging");

initializeApp();
const TIMEOUTSECOND = 60;

//I think we are done with backend
//We have all the following functions we need

//SetUserData
//ReadUserData
//UpdateUserData
//Send Message

exports.setUserData = onRequest(
  { timeoutSeconds: TIMEOUTSECOND },
  async (req, res, next) => {
    if (req.method !== "PUT") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const idToken = req.query?.idtoken;
    let payload = JSON.parse(req.query.payload ?? "{}");
    try {
      //Get uuid
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uuid = decodedToken.uid;

      //Get and Set doc
      let writeResult = await getFirestore()
        .collection("messages")
        .doc(`${uuid}`)
        .set(payload);

      //Response
      res.status(200).json({
        result: `Message with ID added. ${Date.now()} ${uuid} ${
          writeResult.id
        }`,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

exports.getUserData = onRequest(
  { timeoutSeconds: TIMEOUTSECOND },
  async (req, res) => {
    if (req.method !== "GET") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const idToken = req.query?.idtoken;
    try {
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uuid = decodedToken.uid;

      let docSnapshot = await getFirestore()
        .collection("messages")
        .doc(`${uuid}`)
        .get();

      if (docSnapshot.exists) {
        let docData = docSnapshot.data();
        res.status(200).json(docData);
      } else {
        res.status(404).send("Document does not exist");
      }
    } catch (error) {
      console.log(error);
    }
  }
);

exports.updateUserData = onRequest(
  { timeoutSeconds: TIMEOUTSECOND },
  async (req, res, next) => {
    if (req.method !== "PUT") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const idToken = req.query?.idtoken;
    let payload = JSON.parse(req.query.payload ?? "{}");
    try {
      //Get uuid
      const decodedToken = await getAuth().verifyIdToken(idToken);
      const uuid = decodedToken.uid;

      //Get DocReference
      let docReference = await getFirestore()
        .collection("messages")
        .doc(`${uuid}`);

      const updateFields = configureUpdateFields(payload);
      console.table(updateFields);

      let afterMath = docReference.update({
        ...updateFields,
      });

      //Response
      res.status(200).json({
        result: `Message with ID UPDATED. ${Date.now()} ${uuid} ${
          afterMath.id
        }`,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

exports.onChangeMessage = onDocumentUpdated("messages/{uid}", async (event) => {
  const snapshot = event.data;
  console.log(Boolean(snapshot));
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }

  const before = snapshot.before.exists && snapshot.before.data();
  const after = snapshot.after.exists && snapshot.after.data();

  //Array of fields that are changed from previous state
  const updatedFields = changedFields(before, after);
  console.log("Updated Fields", updatedFields);

  if (
    updatedFields.length === 0 ||
    updatedFields.includes("tokens") ||
    updatedFields.includes("timeCopied")
  ) {
    return;
  } else if (updatedFields.includes("content")) {
    //pass
  }

  const message = {
    data: {
      afterUpdate: JSON.stringify(after),
      updatedFields: JSON.stringify(updatedFields),
    },
    tokens: after.tokens,
  };

  // console.log(message);

  try {
    const msgResponse = await getMessaging().sendEachForMulticast(message);
    console.log("Response", msgResponse);
    //Delete based on failures in msg. Use msgResponse and another call
  } catch (error) {
    console.log("Error sending message:", error);
  }
});

function stringifyObject(obj) {
  const stringifiedObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      stringifiedObj[key] = JSON.stringify(obj[key]);
    }
  }

  return stringifiedObj;
}

//Changed Fields should find
//Fields that have been changed ie. not equal
//Fields that are missing or been added

//SOLVED
//If before is undefined, and after is defined
//New document. New data first time. We can send as usual
//New Data is always gonna adhere to type rules

//UNSOLVED. NEEDS TESTING TO SEE HOW AFTER CAN BE NON-EXISTING
//If before is defined, and after is undefined
//Concerning. Means data has been deleted
//but document exists ?
//Test. Not sure if this is possible
//Maybe just return before object

//SOLVED
//If both after and before are undefined
//No change. Since no update. Weird but must be handled
//Didnt't exist before and doesn't exist now :)
//ChangedField() already takes care of it by returning an empty array

//SOLVED
//Apart from that if after has any missing fields or smt new has been added:
//Find differing fields using ChangedFields()

//Maybe have a return message as second return for more info
function changedFields(before, after) {
  const res = [];

  if (!before && after) {
    // If 'before' is undefined but 'after' is defined,
    // push all fields from 'after' into the result array
    Object.keys(after).forEach((key) => {
      res.push(key);
    });
  } else if (before && after) {
    // If both 'before' and 'after' are defined, compare fields
    Object.keys(after).forEach((key) => {
      if (
        !Object.hasOwn(before, key) || // New field in 'after'
        JSON.stringify(before[key]) !== JSON.stringify(after[key]) // Changed value
      ) {
        res.push(key);
      }
    });

    // Check for missing fields in 'after'
    Object.keys(before).forEach((key) => {
      if (!Object.hasOwn(after, key)) {
        // Field missing in 'after'
        res.push(key);
      }
    });
  }
  return res;
}

function configureUpdateFields(config) {
  const { updateField, data } = config;

  const res = { ...data };

  if (updateField === "TOKEN") {
    const { action } = config;
    if (action === "UNION") {
      res.tokens = FieldValue.arrayUnion(data.tokens);
    } else if (action === "REMOVE") {
      res.tokens = FieldValue.arrayRemove(data.tokens);
    }
  }

  return res;
}
