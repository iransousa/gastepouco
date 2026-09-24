import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Leitura do QR code pela câmera.
 *
 * `BarcodeDetector` quando existe (Chrome no Android: nativo, rápido, sem
 * baixar nada); `@zxing/browser` como reserva, carregado sob demanda para não
 * pesar no primeiro acesso de quem não precisa dele.
 *
 * A câmera nunca é o único caminho: a tela sempre oferece galeria e digitar a
 * chave (docs/08-ACESSIBILIDADE.md). Este hook cuida só da câmera e falha de
 * forma explícita, para a tela poder oferecer as alternativas.
 */

export type EstadoDaCamera =
  | 'iniciando'
  | 'lendo'
  | 'sem-permissao'
  | 'sem-camera'
  | 'erro';

interface Detector {
  detect(fonte: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (opcoes: { formats: string[] }) => Detector;
  }
}

export function useLeitorDeQr(ligado: boolean, aoLer: (valor: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [estado, setEstado] = useState<EstadoDaCamera>('iniciando');
  const [temLanterna, setTemLanterna] = useState(false);
  const [lanternaLigada, setLanternaLigada] = useState(false);

  const trilhaRef = useRef<MediaStreamTrack | null>(null);
  // Guarda o callback num ref: senão trocar de função recriaria a câmera a
  // cada render, e a lanterna apagaria sozinha.
  const aoLerRef = useRef(aoLer);
  aoLerRef.current = aoLer;

  const alternarLanterna = useCallback(async () => {
    const trilha = trilhaRef.current;
    if (!trilha) return;
    const proxima = !lanternaLigada;
    try {
      await trilha.applyConstraints({
        advanced: [{ torch: proxima } as MediaTrackConstraintSet],
      });
      setLanternaLigada(proxima);
    } catch {
      // Alguns aparelhos anunciam a lanterna e recusam ligar. Esconder o botão
      // é melhor do que deixá-lo ali sem efeito.
      setTemLanterna(false);
    }
  }, [lanternaLigada]);

  useEffect(() => {
    if (!ligado) return;

    let parado = false;
    let fluxo: MediaStream | null = null;
    let quadro = 0;

    async function comecar(): Promise<void> {
      if (!navigator.mediaDevices?.getUserMedia) {
        setEstado('sem-camera');
        return;
      }

      try {
        fluxo = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
      } catch (falha) {
        // Distinguir importa: "negou a permissão" pede outra explicação na
        // tela do que "não existe câmera".
        const nome = (falha as { name?: string }).name;
        setEstado(nome === 'NotAllowedError' ? 'sem-permissao' : 'sem-camera');
        return;
      }

      if (parado) {
        fluxo.getTracks().forEach((t) => t.stop());
        return;
      }

      const video = videoRef.current;
      if (!video) return;

      video.srcObject = fluxo;
      video.setAttribute('playsinline', 'true'); // iPhone: não abre em tela cheia
      video.muted = true;
      await video.play().catch(() => undefined);

      const trilha = fluxo.getVideoTracks()[0] ?? null;
      trilhaRef.current = trilha;
      const capacidades = trilha?.getCapabilities?.() as { torch?: boolean } | undefined;
      setTemLanterna(Boolean(capacidades?.torch));

      setEstado('lendo');

      const nativo = window.BarcodeDetector
        ? new window.BarcodeDetector({ formats: ['qr_code'] })
        : null;

      const zxing = nativo
        ? null
        : await import('@zxing/browser')
            .then((modulo) => new modulo.BrowserQRCodeReader())
            .catch(() => null);

      if (!nativo && !zxing) {
        setEstado('erro');
        return;
      }

      const tela = document.createElement('canvas');
      const pincel = tela.getContext('2d', { willReadFrequently: true });

      const procurar = async (): Promise<void> => {
        if (parado) return;

        quadro += 1;
        // Um quadro sim, um não: procurar em todos gasta bateria à toa e ainda
        // acha o código em menos de um segundo.
        if (quadro % 2 === 0 && video.videoWidth > 0 && pincel) {
          const escala = Math.min(1, 640 / video.videoWidth);
          tela.width = Math.round(video.videoWidth * escala);
          tela.height = Math.round(video.videoHeight * escala);
          pincel.drawImage(video, 0, 0, tela.width, tela.height);

          try {
            if (nativo) {
              const achados = await nativo.detect(tela);
              const valor = achados[0]?.rawValue;
              if (valor) {
                parado = true;
                aoLerRef.current(valor);
                return;
              }
            } else if (zxing) {
              const achado = zxing.decodeFromCanvas(tela);
              if (achado?.getText()) {
                parado = true;
                aoLerRef.current(achado.getText());
                return;
              }
            }
          } catch {
            // Quadro sem código: normal, é o caso comum. Segue procurando.
          }
        }

        requestAnimationFrame(() => void procurar());
      };

      requestAnimationFrame(() => void procurar());
    }

    void comecar();

    return () => {
      parado = true;
      trilhaRef.current = null;
      fluxo?.getTracks().forEach((trilha) => trilha.stop());
    };
  }, [ligado]);

  return { videoRef, estado, temLanterna, lanternaLigada, alternarLanterna };
}
