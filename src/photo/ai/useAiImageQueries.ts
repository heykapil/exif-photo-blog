import { useCallback, useEffect, useRef } from 'react';
import useAiImageQuery from './useAiImageQuery';
import useTitleCaptionAiImageQuery from './useTitleCaptionAiImageQuery';
import { ALL_AI_AUTO_GENERATED_FIELDS, AiAutoGeneratedField } from '.';

export type AiContent = ReturnType<typeof useAiImageQueries>;

export default function useAiImageQueries(
  textFieldsToAutoGenerate: AiAutoGeneratedField[] = [],
  imageData?: string,
) {
  const [
    requestTitleCaption,
    _title,
    _caption,
    _isLoadingTitle,
    _isLoadingCaption,
    resetTitle,
    resetCaption,
  ] = useTitleCaptionAiImageQuery(imageData);

  const [
    requestTitle,
    titleSolo,
    isLoadingTitleSolo,
    resetTitleSolo,
  ] = useAiImageQuery(imageData, 'title');

  const [
    requestCaption,
    captionSolo,
    isLoadingCaptionSolo,
    resetCaptionSolo,
  ] = useAiImageQuery(imageData, 'caption');

  const [
    requestTags,
    tags,
    isLoadingTags,
  ] = useAiImageQuery(imageData, 'tags');

  const [
    requestSemantic,
    semanticDescription,
    isLoadingSemantic,
  ] = useAiImageQuery(imageData, 'description-small');

  const title = _title || titleSolo;
  const caption = _caption || captionSolo;
  const isLoadingTitle = _isLoadingTitle || isLoadingTitleSolo;
  const isLoadingCaption = _isLoadingCaption || isLoadingCaptionSolo;

  const isLoading =
    isLoadingTitle ||
    isLoadingCaption ||
    isLoadingTags ||
    isLoadingSemantic;

  const hasRunAllQueriesOnce = useRef(false);

  const request = useCallback(async (
    fields = ALL_AI_AUTO_GENERATED_FIELDS,
  ) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('RUNNING AI QUERIES', fields);
    }
    hasRunAllQueriesOnce.current = true;
    if (fields.includes('title') && fields.includes('caption')) {
      // Unmask individual title + caption
      resetTitleSolo();
      resetCaptionSolo();
      requestTitleCaption();
    } else {
      if (fields.includes('title')) {
        // Unmask combined title
        resetTitle();
        resetTitleSolo();
        requestTitle();
      }
      if (fields.includes('caption')) {
        // Unmask combined caption
        resetCaption();
        resetCaptionSolo();
        requestCaption();
      }
    }
    if (fields.includes('tags')) { requestTags(); }
    if (fields.includes('semantic')) { requestSemantic(); }
  }, [
    requestTitleCaption,
    requestTitle,
    requestCaption,
    requestTags,
    requestSemantic,
    resetTitle,
    resetTitleSolo,
    resetCaption,
    resetCaptionSolo,
  ]);

  useEffect(() => {
    if (imageData && !hasRunAllQueriesOnce.current) {
      if (textFieldsToAutoGenerate.length > 0) {
        request(textFieldsToAutoGenerate);
      }
    }
  }, [textFieldsToAutoGenerate, imageData, request]);

  return {
    request,
    title,
    caption,
    tags,
    semanticDescription,
    isLoading,
    isLoadingTitle,
    isLoadingCaption,
    isLoadingTags,
    isLoadingSemantic,
  };
}
