import React from 'react';
import { MaterialDesignIcons } from '@react-native-vector-icons/material-design-icons/static';
import type { ComponentProps } from 'react';

export type AppIconName = ComponentProps<typeof MaterialDesignIcons>['name'];
type IconName = AppIconName;

type Props = {
    name: IconName;
    size?: number;
    color: string;
};

export function AppIcon({ name, size = 24, color }: Props) {
    return <MaterialDesignIcons name={name} size={size} color={color} />;
}