import React from 'react';
import styles from './AppLogin.module.css';
import {Poppins} from "next/font/google";
import {useRouter} from "next/router";
import { signIn } from "next-auth/react";

const poppins = Poppins({
    subsets: ['latin'],
    weight: ['400', '700'], // Add weights as needed
});

interface LoginProps {

}

export function AppLogin({}: LoginProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSignIn = async () => {
        setIsLoading(true);
        try {
            await signIn('azure-ad', { callbackUrl: '/' });
        } catch (error) {
            console.error('Sign in error:', error);
            setIsLoading(false);
        }
    };

    return (
        <div className={`${styles.background} ${poppins.className}`}>
            <div className={styles.box}>
                <h1>Welcome to Lumina<br/>your Scientific Group AI Assistant</h1>
                <button 
                    type="button" 
                    id={styles.loginButton} 
                    onClick={handleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? 'SIGNING IN...' : 'SIGN IN'}
                </button>
            </div>
        </div>
    );
}
