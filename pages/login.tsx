import React from 'react';
import styles from './login.module.css';
import {Poppins} from "next/font/google";
import {useRouter} from "next/router";

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '700'], // Add weights as needed
});

interface LoginProps {

}

export default function Login({}: LoginProps) {

    const router = useRouter();
    const handleSignIn = () => {
        localStorage.setItem('isLoggedIn', 'true');
        router.push('/');
    };

    return (
        <div className={`${styles.background} ${poppins.className}`}>
            <div className={styles.box}>
                <h1>Welcome to BOB<br/>your Scientific Group AI Assistant</h1>
                <button type={"button"} id={styles.loginButton} onClick={handleSignIn}>SIGN IN</button>
            </div>
        </div>
    );
}
