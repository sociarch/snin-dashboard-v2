import { CognitoUserPool } from "amazon-cognito-identity-js";

const poolData = {
    UserPoolId: "us-east-1_GyTh6JS9k",
    ClientId: "4lgbr5rglkt3rnq346o96loufm",
};

export const userPool = new CognitoUserPool(poolData);
