#include <iostream>
#include <fstream>
#include <iomanip>
#include <string>

using namespace std;

void CreateAccount();
void SwitchAdmin();
void ResetPassword();

int main() {
    string username, password, eaddress, checkUser, checkPass;
    ifstream inFile;
    int choice;

    // Display options and get user choice
    cout << "You are at the Login Screen\nPick an Option (Enter 0-3)\n\n";     // Header
    cout << "\t0. Login\n";
    cout << "\t1. Create Account\n";
    cout << "\t2. Reset Password\n";
    cout << "\t3. Go to Admin\n\nChoice: ";
    cin >> choice;

    // Validate choice
    while (choice < 0 || choice > 3) {     
        cout << "Invalid choice. Choose an option from 0 to 3: ";
        cin >> choice;
    }

    // Execute code based on choice
    if (choice == 0) {
        cout << "\nEnter your username: ";
        cin >> username;
        cout << "Enter your password: ";
        cin >> password;

        inFile.open("passwordDB.txt");

        // Find username and match password with username
        while (inFile >> checkUser >> checkPass >> eaddress) {
            if (username == checkUser) {
                if (password == checkPass) {
                    cout << "Successfully logged in!";
                    break;
                } else {
                    cout << "Username and password do not match (Refresh page; Password not found error)";
                    break;
                }
            }
        }

        // If user not found, display error
        if (username != checkUser) {
            cout << "Username and password do not match (Refresh page; User not found error)";
        }

    } else if (choice == 1) {
        CreateAccount();
    } else if (choice == 2) {
        ResetPassword();
    } else if (choice == 3) {
        SwitchAdmin();
    }

}

// Function that writes username, password, and email to database file
void CreateAccount() {
    ofstream outFile;
    string eaddress, username, newP, confirmP;
    char choice = 'n';

    // Open file but do not rewrite it, only add to it
    outFile.open("passwordDB.txt", ofstream::app);
    if (!outFile) {
        cout << "LN 77 Oufile failed";
    }

    // While user does not confirm, keep asking for data
    while (choice != 'y') {
        // Ask for user info
        cout << "\nEnter your Email Address: ";
        cin >> eaddress;
        cout << "Enter a Username: ";
        cin >> username;
        cout << "Enter a Password: ";
        cin >> newP;
        cout << "Confirm Password: ";
        cin >> confirmP;

        // Confirm that passwords match
        while (newP != confirmP) {
            cout << "Passwords do not match. Please re-enter them.\n";
            cout << "New Password: ";
            cin >> newP;
            cout << "Confirm Password: ";
            cin >> confirmP;
        }
        // Ask user if they want to confirm info
        cout << "Email: " << eaddress << "\nUsername: " << username << "\nPassword" << "\nConfirm? (y/n)";
        cin >> choice;
    }

    // Email sent message
    cout << "We sent an email to your address. Click confirm on it to create account. (User must manually go back to login to relogin)";
    // Add a confirm condition here that the user must press on their email before account is created

    // Only update database if user confirms account on email 
    outFile << left << setw(15) << username << setw(15) << newP << eaddress << endl;

    // Close file
    outFile.close();
}

// Reset a Password
void ResetPassword() {
    string username, eaddress, newP, confirmP, checkAddress, checkUser, checkPass;
    bool userFound = false;
    ifstream inFile; //File to read from
    ofstream outFile; //Temporary file

    // Prompt for username and email and password
    cout << "Enter your email address: ";
    cin >> eaddress;
    cout << "Enter your username: ";
    cin >> username;
    cout << "Enter your new password: ";
    cin >> newP;
    cout << "Confirm Password: ";
    cin >> confirmP;

    // Confirm that passwords match
    while (newP != confirmP) {
        cout << "Passwords do not match. Please re-enter them.\n";
        cout << "New Password: ";
        cin >> newP;
        cout << "Confirm Password: ";
        cin >> confirmP;
    }

    // Open both passwordDB and temporary DB
    inFile.open("passwordDB.txt");    
    outFile.open("tempDB.txt");
    outFile << "";      // Wipe outFile so it does not keep appending
    outFile.close();
    outFile.open("tempDB.txt", ofstream::app);     // Open outFile that appends info
    if(!inFile || !outFile) {
        cout << "Error opening files!" << endl;
    }

    // Check if user name and email match; If they do, replace password
    while (inFile >> checkUser >> checkPass >> checkAddress) {     // While inFile reads 3 strings,
        if (username == checkUser) {     // Find a username that user entered that matches username in DB
            userFound = true;

            if (eaddress == checkAddress) {     // Check if user address matches address in DB if username found

                // Once email and user are confirmed to match, the app would send an email and the 
                // user would have to click confirm on the email in order for the rest of the code to run.
                // Idk how to do that tho

                string temp;

                // Reset file pointer
                inFile.clear();
                inFile.seekg(0);

                // Write inFile into outFile with replaced password
                while(inFile >> temp) {
                    if (temp == checkPass){
                        temp = confirmP;
                        outFile << left << setw(15) << temp;
                    } else if (temp == checkUser) {
                        outFile << left << setw(15) << temp;
                    } else if (temp == checkAddress) {
                        outFile << left << setw(15) << temp << endl;
                    }

                
                
                }
                cout << "\nPassword has been successfully reset!";
            } else {
                // Error message if username and email don't match
                cout << "\nUsername and email do not match (Refresh page; Email not found error)";
                break;
            }
        }
    }

    // Error message if user not found
    if (userFound == false) {
        cout << "\nUsername and email do not match (Refresh page; User not found error)";
    }

    // Reset pointer to go through file again to print all other info
    inFile.clear();
    inFile.seekg(0);

    // Write all other info into tempDB
    while (inFile >> checkUser >> checkPass >> checkAddress) { 
        if (username == checkUser) {     // Do not add old info into file
            outFile << "";
        } else {
            // If username does not match, just write the original user info into tempDB; For info before username found
            outFile << left << setw(15) << checkUser << setw(15) << checkPass << checkAddress << endl;
        }
    }

    // Switch inFile and outFile files
    inFile.close();
    outFile.close();
    outFile.open("passwordDB.txt");
    outFile << "";     // Wipe passwordDB so that you can append tempDB back into it as a fresh file
    outFile.close();
    inFile.open("tempDB.txt");
    outFile.open("passwordDB.txt", ofstream::app);
    if(!inFile || !outFile) {
        cout << "Error opening files (on return)!" << endl;
    }

    // Rewrite tempDB (with edited password) into passwordDB (which is now empty)
    while (inFile >> checkUser >> checkPass >> checkAddress) {  
        outFile << left << setw(15) << checkUser << setw(15) << checkPass << checkAddress << endl;
    }

}

// Switches to admin accounts; 
void SwitchAdmin() {
    cout << "\nThis option/button navigates to an admin account. It's not necessary rn, so this is just a placeholder line";
}