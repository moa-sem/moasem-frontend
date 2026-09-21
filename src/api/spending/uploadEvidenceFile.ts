import { File, UploadType } from 'expo-file-system';

/** 업로드할 증빙 이미지. 사진 선택기가 준 값을 그대로 담는다. */
export type EvidenceFile = {
  uri: string;
  mimeType: string;
  fileSize: number;
};

/**
 * 발급받은 URL로 증빙 이미지를 올린다.
 *
 * 파일은 우리 서버가 아니라 저장소로 바로 간다. 그래서 axios 공통 인스턴스를 쓰지 않는다.
 * 인증 헤더를 붙이면 서명 검증이 어긋나고, 서버가 이미지를 중계하지 않아 메모리도 쓰지 않는다.
 *
 * Content-Type은 URL을 발급받을 때 서명에 포함된 값이라 그대로 보내야 한다. 다르면 저장소가 거부한다.
 */
export async function uploadEvidenceFile(uploadUrl: string, evidence: EvidenceFile): Promise<void> {
  const result = await new File(evidence.uri).upload(uploadUrl, {
    httpMethod: 'PUT',
    uploadType: UploadType.BINARY_CONTENT,
    headers: { 'Content-Type': evidence.mimeType },
  });

  // 저장소는 공통 응답 포맷을 쓰지 않는다. 인터셉터가 손대지 않으므로 여기서 직접 확인한다.
  if (result.status < 200 || result.status >= 300) {
    throw {
      code: 'EVIDENCE_UPLOAD_FAILED',
      message: '증빙 이미지를 올리지 못했습니다. 다시 시도해주세요.',
      status: result.status,
    };
  }
}
