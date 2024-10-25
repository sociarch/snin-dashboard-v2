import { userPool } from "./awsConfig";
import { CognitoUser, AuthenticationDetails } from "amazon-cognito-identity-js";

export const signIn = (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
        const authenticationDetails = new AuthenticationDetails({
            Username: username,
            Password: password,
        });

        const cognitoUser = new CognitoUser({
            Username: username,
            Pool: userPool,
        });

        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: (result) => {
                resolve();
            },
            onFailure: (err) => {
                reject(err);
            },
        });
    });
};
