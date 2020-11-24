import React, {
    createContext,
    useCallback,
    useState,
    useContext,
    useEffect,
} from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface User {
    id: string;
    name: string;
    email: string;
    avatar_url: string;
}
interface AuthState {
    token: string;
    user: User;
}

interface SignInCredentials {
    email: string;
    password: string;
}

interface AuthContextData {
    signIn(credentials: SignInCredentials): Promise<void>;
    signOut(): void;
    updateUser(user: User): Promise<void>;
    user: User;
    loading: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC = ({children}) => {
    const [data, setData] = useState<AuthState>({} as AuthState);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData(): Promise<void> {
            const [token, user] = await AsyncStorage.multiGet([
                '@GoBarber:token',
                '@GoBarber:user',
            ]);

            if (token[1] && user[1]) {
                api.defaults.headers.authorization = `Bearer ${token[1]}`;

                setData({token: token[1], user: JSON.parse(user[1])});
            }

            setLoading(false);
        }
        loadStorageData();
    }, []);

    const signIn = useCallback(async ({email, password}) => {
        const response = await api.post('sessions', {
            email,
            password,
        });

        const {token, user} = response.data;
        AsyncStorage.multiSet([
            ['@GoBarber:token', token],
            ['@GoBarber:user', JSON.stringify(user)],
        ]);

        api.defaults.headers.authorization = `Bearer ${token}`;

        setData({token, user});
    }, []);

    const signOut = useCallback(async () => {
        await AsyncStorage.multiRemove(['@GoBarber:token', '@GoBarber:user']);

        setData({} as AuthState);
    }, []);

    const updateUser = useCallback(
        async (updateData: Partial<User>) => {
            setData({
                token: data.token,
                user: {
                    ...data.user,
                    ...updateData,
                },
            });
            await AsyncStorage.setItem(
                '@GoBarber:user',
                JSON.stringify(updateData),
            );
        },
        [setData, data.token, data.user],
    );

    return (
        <AuthContext.Provider
            value={{user: data.user, signIn, signOut, loading, updateUser}}>
            {children}
        </AuthContext.Provider>
    );
};

export function useAuth(): AuthContextData {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    return context;
}
