import React, {useCallback, useRef} from 'react';
import {
    View,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    TextInput,
    Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {Form} from '@unform/mobile';
import {FormHandles} from '@unform/core';

import * as Yup from 'yup';
import Icon from 'react-native-vector-icons/Feather';
import ImagePicker from 'react-native-image-picker';
import Input from '../../components/Input';
import Button from '../../components/Button';
import {useAuth} from '../../hooks/auth';

import {
    Container,
    Title,
    UserAvatarButton,
    UserAvatar,
    BackButton,
} from './styles';
import getValidationErrors from '../../utils/getValidationErrors';
import api from '../../services/api';

interface ProfileFormData {
    name: string;
    email: string;
    old_password: string;
    password: string;
    password_confirmation: string;
}

const SignUp: React.FC = () => {
    const navigation = useNavigation();

    const formRef = useRef<FormHandles>(null);

    const emailInputRef = useRef<TextInput>(null);
    const oldPasswordInputRef = useRef<TextInput>(null);
    const passwordInputRef = useRef<TextInput>(null);
    const confirmPasswordInputRef = useRef<TextInput>(null);

    const {user, updateUser} = useAuth();

    const handleSignUp = useCallback(
        async (data: ProfileFormData) => {
            try {
                formRef.current?.setErrors({});
                const schema = Yup.object().shape({
                    name: Yup.string().required('Nome obrigatório'),
                    email: Yup.string()
                        .required('E-mail obrigatório')
                        .email('Digite um e-mail válido'),
                    old_password: Yup.string(),
                    password: Yup.string().when('old_password', {
                        is: (val) => !!val.length,
                        then: Yup.string().required('Campo obrigatório'),
                        otherwise: Yup.string(),
                    }),
                    password_confirmation: Yup.string().oneOf(
                        [Yup.ref('password'), undefined],
                        'Confirmação incorreta',
                    ),
                });

                await schema.validate(data, {
                    abortEarly: false,
                });

                const formData = {
                    name: data.name,
                    email: data.email,
                    ...(data.old_password
                        ? {
                              old_password: data.password,
                              password: data.password,
                              password_confirmation: data.password_confirmation,
                          }
                        : {}),
                };

                const response = await api.put('/profile', formData);

                updateUser(response.data);

                navigation.goBack();

                Alert.alert(
                    'Perfil atualizado!',
                    'Você já pode fazer seu logon no GoBarber!',
                );
            } catch (err) {
                if (err instanceof Yup.ValidationError) {
                    const errors = getValidationErrors(err);
                    formRef.current?.setErrors(errors);
                    return;
                }

                Alert.alert(
                    'Erro na atualização do perfil',
                    'Ocorreu um erro ao atualizar o seu perfil, tente novamente.',
                );
            }
        },
        [navigation, updateUser],
    );

    const handleUpdateAvatar = useCallback(() => {
        ImagePicker.showImagePicker(
            {
                title: 'Selecione um avatar',
                cancelButtonTitle: 'Cancelar',
                takePhotoButtonTitle: 'Usar câmera',
                chooseFromLibraryButtonTitle: 'Escolher da galeria',
            },
            (response) => {
                if (response.didCancel) {
                    return;
                }

                if (response.error) {
                    Alert.alert('Erro ao atualizar seu avatar.');
                    return;
                }

                const data = new FormData();
                data.append('avatar', {
                    uri: response.uri,
                    name: `${user.id}.jpg`,
                    type: 'image/jpg',
                });

                api.patch('users/avatar', data).then((apiResponse) => {
                    updateUser(apiResponse.data);
                });
            },
        );
    }, [updateUser, user.id]);

    const handleGoBack = useCallback(() => {
        navigation.goBack();
    }, [navigation]);

    return (
        <>
            <KeyboardAvoidingView
                style={{flex: 1}}
                enabled
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={{flex: 1}}
                    keyboardShouldPersistTaps="handled">
                    <Container>
                        <BackButton onPress={handleGoBack}>
                            <Icon
                                name="chevron-left"
                                size={24}
                                color="#999591"
                            />
                        </BackButton>
                        <UserAvatarButton onPress={handleUpdateAvatar}>
                            <UserAvatar source={{uri: user.avatar_url}} />
                        </UserAvatarButton>

                        <View>
                            <Title>Meu perfil</Title>
                        </View>

                        <Form
                            initialData={user}
                            onSubmit={handleSignUp}
                            ref={formRef}>
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
                                    oldPasswordInputRef.current?.focus();
                                }}
                            />
                            <Input
                                ref={oldPasswordInputRef}
                                secureTextEntry
                                name="old_password"
                                icon="lock"
                                placeholder="Senha atual"
                                textContentType="newPassword"
                                returnKeyType="next"
                                containerStyle={{marginTop: 16}}
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
                                    confirmPasswordInputRef.current?.focus();
                                }}
                            />
                            <Input
                                ref={confirmPasswordInputRef}
                                secureTextEntry
                                name="password_confirmation"
                                icon="lock"
                                placeholder="Confirmar senha"
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
                                // eslint-disable-next-line prettier/prettier
                            }}
                        >
                            Confirmar mudanças
                        </Button>
                    </Container>
                </ScrollView>
            </KeyboardAvoidingView>
        </>
    );
};

export default SignUp;
