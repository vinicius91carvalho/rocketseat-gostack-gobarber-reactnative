import React, { useCallback, useRef } from 'react';
import {
    Image,
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { Form } from '@unform/mobile';
import { FormHandles } from '@unform/core';

import * as Yup from 'yup';
import Input from '../../components/Input';
import Button from '../../components/Button';

import {
    Container,
    Title,
    BackToSignInButton,
    BackToSignInButtonText,
} from './styles';
import logoImg from '../../assets/logo.png';
import getValidationErrors from '../../utils/getValidationErrors';
import api from '../../services/api';

interface SignUpFormData {
    name: string;
    email: string;
    password: string;
}

const SignUp: React.FC = () => {
    const navigation = useNavigation();

    const formRef = useRef<FormHandles>(null);

    const emailInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);

    const handleSignUp = useCallback(
        async (data: SignUpFormData) => {
            try {
                formRef.current?.setErrors({});
                const schema = Yup.object().shape({
                    name: Yup.string().required('Nome obrigatório'),
                    email: Yup.string()
                        .required('E-mail obrigatório')
                        .email('Digite um e-mail válido'),
                    password: Yup.string().min(6, 'No mínimo 6 dígitos'),
                });

                await schema.validate(data, {
                    abortEarly: false,
                });

                await api.post('/users', data);

                Alert.alert(
                    'Cadastro realizado!',
                    'Você já pode fazer seu logon no GoBarber!',
                );

                navigation.goBack();
            } catch (err) {
                if (err instanceof Yup.ValidationError) {
                    const errors = getValidationErrors(err);
                    formRef.current?.setErrors(errors);
                    return;
                }

                Alert.alert(
                    'Erro no cadastro',
                    'Ocorreu um erro ao fazer cadastro, tente novamente.',
                );
            }
        },
        [navigation],
    );

    return (
        <>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                enabled
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={{ flex: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    <Container>
                        <Image source={logoImg} />

                        <View>
                            <Title>Crie sua conta</Title>
                        </View>

                        <Form onSubmit={handleSignUp} ref={formRef}>
                            <Input
                                autoCapitalize="words"
                                name="name"
                                icon="user"
                                placeholder="Nome"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    emailInputRef.current?.focus();
                                }}
                            />
                            <Input
                                ref={emailInputRef}
                                keyboardType="email-address"
                                autoCorrect={false}
                                autoCapitalize="none"
                                name="email"
                                icon="mail"
                                placeholder="E-mail"
                                returnKeyType="next"
                                onSubmitEditing={() => {
                                    passwordInputRef.current?.focus();
                                }}
                            />
                            <Input
                                ref={passwordInputRef}
                                secureTextEntry
                                name="password"
                                icon="lock"
                                placeholder="Senha"
                                textContentType="newPassword"
                                returnKeyType="send"
                                onSubmitEditing={() => {
                                    formRef.current?.submitForm();
                                }}
                            />
                        </Form>
                        <Button
                            onPress={() => {
                                formRef.current?.submitForm();
                            }}
                        >
                            Cadastrar
                        </Button>
                    </Container>
                </ScrollView>
            </KeyboardAvoidingView>
            <BackToSignInButton
                onPress={() => {
                    navigation.goBack();
                }}
            >
                <Icon name="arrow-left" size={20} color="#fff" />
                <BackToSignInButtonText>
                    Volar para logon
                </BackToSignInButtonText>
            </BackToSignInButton>
        </>
    );
};

export default SignUp;
