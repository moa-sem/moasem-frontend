import { useCallback, useRef, useState } from 'react';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import {
  getReportCsvDownload,
  getReportPdfDownload,
  getReportStatus,
  retryReport,
  type ReportDownloadResponse,
} from '../api/report';
import type { ApiError } from '../types/common';

export type ReportFileKind = 'pdf' | 'csv';

/** 서버에서 보고서 생성이 실패해 다시 만들어야 하는 상황. 화면이 확인창을 띄운다. */
export type RetryPrompt = {
  kind: ReportFileKind;
  eventId: number;
  reason: string | null;
};

type Options = {
  onError?: (message: string) => void;
};

const requestUrl = (kind: ReportFileKind, eventId: number): Promise<ReportDownloadResponse> =>
  kind === 'pdf' ? getReportPdfDownload(eventId) : getReportCsvDownload(eventId);

const GENERATING_MESSAGE = '결산 보고서를 만들고 있어요. 잠시 후 다시 시도해주세요.';

/**
 * 결산 보고서 파일을 내려받아 공유 시트로 넘긴다.
 *
 * 서버는 파일이 아니라 짧게 유효한 URL을 준다. 앱은 그 URL로 저장소에서 직접 받는다.
 * 서버가 파일을 중계하지 않으므로 서버 메모리와 대역폭을 쓰지 않는다.
 *
 * 실패는 두 종류다.
 * - 서버에서 파일 생성이 실패한 경우: 파일이 없으므로 재생성해야 받을 수 있다.
 * - 앱에서 내려받기가 실패한 경우: 파일은 멀쩡하다. 다시 누르면 되고 재생성은 필요 없다.
 * 재생성은 첫 번째에만 제안한다. 두 번째에 부르면 멀쩡한 파일을 다시 만든다.
 */
export function useReportDownload({ onError }: Options = {}) {
  const [downloading, setDownloading] = useState<ReportFileKind | null>(null);
  const [retryPrompt, setRetryPrompt] = useState<RetryPrompt | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryError, setRetryError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const saveAndShare = useCallback(async ({ downloadUrl, fileName }: ReportDownloadResponse, kind: ReportFileKind) => {
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
      throw new Error('이 기기에서는 파일을 공유할 수 없습니다.');
    }
    await Sharing.shareAsync(saved.uri, {
      mimeType: kind === 'pdf' ? 'application/pdf' : 'text/csv',
      dialogTitle: fileName,
      UTI: kind === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
    });
  }, []);

  /**
   * 다운로드 URL을 받지 못했을 때 보고서가 어떤 상태인지 확인한다.
   *
   * 다운로드 API는 "지금은 못 준다"는 것만 알려준다. 생성 중인지 실패했는지는 상태
   * 조회로 구분해야 재생성을 제안할지 기다리라고 할지 정할 수 있다.
   */
  const explainUnavailable = useCallback(
    async (kind: ReportFileKind, eventId: number) => {
      try {
        const status = await getReportStatus(eventId);
        if (status.status === 'FAILED' && status.retryable) {
          setRetryError(null);
          setRetryPrompt({ kind, eventId, reason: status.failureReason });
          return;
        }
        onError?.(GENERATING_MESSAGE);
      } catch (error: unknown) {
        // 마감 직후에는 보고서 행이 아직 없어 404가 난다. 곧 만들어지므로 기다리라고 안내한다.
        if ((error as ApiError)?.code === 'REPORT_NOT_FOUND') {
          onError?.(GENERATING_MESSAGE);
          return;
        }
        onError?.((error as ApiError)?.message ?? '결산 보고서 상태를 확인하지 못했습니다.');
      }
    },
    [onError],
  );

  const download = useCallback(
    async (kind: ReportFileKind, eventId: number) => {
      // 같은 파일을 두 번 받으면 공유 시트가 겹쳐 뜬다.
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      setDownloading(kind);

      try {
        let response: ReportDownloadResponse;
        try {
          // URL은 만료가 짧다. 미리 받아 두지 않고 누를 때 발급받는다.
          response = await requestUrl(kind, eventId);
        } catch (error: unknown) {
          const code = (error as ApiError)?.code;
          if (code === 'REPORT_NOT_DOWNLOADABLE' || code === 'REPORT_NOT_FOUND') {
            await explainUnavailable(kind, eventId);
            return;
          }
          throw error;
        }
        // 여기서 실패하면 파일은 멀쩡하다. 재생성하지 않고 오류만 알린다.
        await saveAndShare(response, kind);
      } catch (error: unknown) {
        const message = (error as ApiError)?.message ?? (error as Error)?.message;
        onError?.(message ?? '결산 보고서를 내려받지 못했습니다.');
      } finally {
        inFlightRef.current = false;
        setDownloading(null);
      }
    },
    [explainUnavailable, onError, saveAndShare],
  );

  /**
   * 재생성 후 이어서 내려받는다.
   *
   * 서버는 확정된 결산 수치를 그대로 재사용하고 파일만 다시 만든다. 금액은 달라지지 않는다.
   */
  const confirmRetry = useCallback(async () => {
    if (!retryPrompt) return;
    const { kind, eventId } = retryPrompt;

    setIsRetrying(true);
    setRetryError(null);
    try {
      const status = await retryReport(eventId);
      if (status.status !== 'COMPLETED') {
        setRetryError(status.failureReason ?? '다시 만들지 못했습니다. 잠시 후 다시 시도해주세요.');
        return;
      }
      setRetryPrompt(null);
      await download(kind, eventId);
    } catch (error: unknown) {
      setRetryError((error as ApiError)?.message ?? '다시 만들지 못했습니다.');
    } finally {
      setIsRetrying(false);
    }
  }, [download, retryPrompt]);

  const cancelRetry = useCallback(() => {
    setRetryPrompt(null);
    setRetryError(null);
  }, []);

  return { download, downloading, retryPrompt, isRetrying, retryError, confirmRetry, cancelRetry };
}
