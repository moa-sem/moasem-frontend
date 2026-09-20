import { useCallback, useRef, useState } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  getReportCsvDownload,
  getReportPdfDownload,
  type ReportDownloadResponse,
} from '../api/report';
import type { ApiError } from '../types/common';

export type ReportFileKind = 'pdf' | 'csv';

type Options = {
  onError?: (message: string) => void;
};

const requestUrl = (kind: ReportFileKind, eventId: number): Promise<ReportDownloadResponse> =>
  kind === 'pdf' ? getReportPdfDownload(eventId) : getReportCsvDownload(eventId);

const toMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError | undefined;
  return apiError?.message ?? fallback;
};

/**
 * 결산 보고서 파일을 내려받아 공유 시트로 넘긴다.
 *
 * 서버는 파일이 아니라 짧게 유효한 URL을 준다. 앱은 그 URL로 저장소에서 직접 받는다.
 * 서버가 파일을 중계하지 않으므로 서버 메모리와 대역폭을 쓰지 않는다.
 */
export function useReportDownload({ onError }: Options = {}) {
  const [downloading, setDownloading] = useState<ReportFileKind | null>(null);
  const inFlightRef = useRef(false);

  const download = useCallback(
    async (kind: ReportFileKind, eventId: number) => {
      // 같은 파일을 두 번 받으면 공유 시트가 겹쳐 뜬다.
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setDownloading(kind);

      try {
        // URL은 만료가 짧다. 미리 받아 두지 않고 누를 때 발급받는다.
        const { downloadUrl, fileName } = await requestUrl(kind, eventId);

        // 저장소 키에는 행사명이 없다. 그대로 저장하면 어느 행사 보고서인지 알 수 없어
        // 응답이 준 파일명으로 받는다.
        const target = new File(Paths.cache, fileName);
        if (target.exists) target.delete();

        // 인증 헤더를 붙이지 않는다. 서버가 아니라 저장소로 가는 요청이라
        // 헤더를 얹으면 서명 검증이 어긋난다.
        const saved = await File.downloadFileAsync(downloadUrl, target);

        // 내려받기만 하면 파일은 앱 내부에 머문다. 공유 시트로 넘겨야 사용자가
        // 다른 앱으로 보내거나 파일 앱에 저장할 수 있다.
        if (!(await Sharing.isAvailableAsync())) {
          onError?.('이 기기에서는 파일을 공유할 수 없습니다.');
          return;
        }

        await Sharing.shareAsync(saved.uri, {
          mimeType: kind === 'pdf' ? 'application/pdf' : 'text/csv',
          dialogTitle: fileName,
          UTI: kind === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
        });
      } catch (error: unknown) {
        onError?.(toMessage(error, '결산 보고서를 내려받지 못했습니다.'));
      } finally {
        inFlightRef.current = false;
        setDownloading(null);
      }
    },
    [onError],
  );

  return { download, downloading };
}
