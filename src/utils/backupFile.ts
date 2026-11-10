import { FileSystem, Dirs } from 'react-native-file-access';
import {
    keepLocalCopy,
    pick,
    saveDocuments,
    types,
} from '@react-native-documents/picker';

import type { BusinessManagerBackup } from '../database/repositories/dataBackupRepository';

const BACKUP_MIME_TYPE = 'application/json';
const BACKUP_FILE_PREFIX = 'business-manager-backup';

function toFileUri(path: string): string {
    return `file://${encodeURI(path)}`;
}

function getBackupFileName(): string {
    const date = new Date()
        .toISOString()
        .slice(0, 10);

    return `${BACKUP_FILE_PREFIX}-${date}.json`;
}

export async function exportBackupFile(
    backup: BusinessManagerBackup,
): Promise<void> {
    const fileName = getBackupFileName();

    const temporaryPath =
        `${Dirs.CacheDir}/${fileName}`;

    const json = JSON.stringify(backup, null, 2);

    try {
        await FileSystem.writeFile(
            temporaryPath,
            json,
            'utf8',
        );

        const [result] = await saveDocuments({
            sourceUris: [toFileUri(temporaryPath)],
            fileName,
            mimeType: BACKUP_MIME_TYPE,
            copy: true,
        });

        if (result.error) {
            throw new Error(result.error);
        }
    } finally {
        try {
            if (await FileSystem.exists(temporaryPath)) {
                await FileSystem.unlink(temporaryPath);
            }
        } catch {
            // Temporary cleanup failure should not affect the export result.
        }
    }
}

export async function importBackupFile(): Promise<unknown> {
    const [file] = await pick({
        type: [types.json],
        allowMultiSelection: false,
        allowVirtualFiles: false,
    });

    if (!file.hasRequestedType) {
        throw new Error(
            'Please select a Business Manager backup JSON file.',
        );
    }

    const [localCopy] = await keepLocalCopy({
        files: [
            {
                uri: file.uri,
                fileName: file.name ?? 'business-manager-backup.json',
            },
        ],
        destination: 'cachesDirectory',
    });

    if (localCopy.status !== 'success') {
        throw new Error(
            localCopy.copyError || 'Unable to access the selected backup file.',
        );
    }

    const json = await FileSystem.readFile(
        localCopy.localUri,
        'utf8',
    );

    try {
        return JSON.parse(json);
    } catch {
        throw new Error(
            'The selected file is not valid JSON.',
        );
    }
}