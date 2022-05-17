const { readFileSync } = require('fs');
const fetch = require('node-fetch');
const AWS = require('aws-sdk');
const xml2js = require('xml2js');
const XLSX = require('xlsx');

const Utils = require('../bin/utils');
const knex = require('../bin/conn');
require('./foreach');

const s3 = new AWS.S3({ apiVersion: '2006-03-01' });

const BUCKET = process.env.S3_BUCKET;
if (!BUCKET) {
  throw new Error('Missing env variable: "S3_BUCKET"');
}

const syncClinicDBData = async () => {
  Utils.log('CLINIC-DB-LIB', 'syncClinicDBData');
  const dbPub = 'pubmed';
  const termToSearch = 'Stefano+Luminari';
  const apiKey = 'c6830c2e17281d6f44c779ea5bf911cd1f08';

  const eSearch = await fetch(
    // eslint-disable-next-line max-len
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=${dbPub}&term=${termToSearch}&usehistory=y&api_key=${apiKey}&retmode=json&retmax=1000`,
  )
    .then((response) => {
      if (response.status >= 200 && response.status <= 299) {
        return response.json();
      }
      return { err: `esearch api not responding, status ${response.status}` };
    })
    .catch((error) => {
      Utils.errobj('CLINIC-DB-LIB', 'esearch FETCH ERROR', error);
      return { err: error };
    });

  if (eSearch.err !== undefined) {
    return 'fail';
  }

  const entryTerm = await knex
    .select()
    .from('term_search_item')
    .where('term', termToSearch)
    .then((results) => results);

  const entryBody = {
    term: termToSearch,
    count: eSearch.esearchresult.count,
    author_count: eSearch.esearchresult.translationstack[0].count,
    investigator_count: eSearch.esearchresult.translationstack[1].count,
  };

  // eslint-disable-next-line no-unused-vars
  const result =
    entryTerm && entryTerm.length > 0
      ? await knex('term_search_item').update(entryBody).where('id', entryTerm[0].id)
      : await knex('term_search_item').insert(entryBody);

  const entryTermAfterSave = await knex
    .select()
    .from('term_search_item')
    .where('term', termToSearch)
    .then((results) => results);

  await knex('term_entry').where('id_term', entryTermAfterSave[0].id).del();

  // eslint-disable-next-line consistent-return
  await eSearch.esearchresult.idlist.forEachAsync(async (entry) => {
    try {
      const eFetch = await fetch(
        // eslint-disable-next-line max-len
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=${dbPub}&id=${entry}&api_key=${apiKey}&retmode=xml`,
      )
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            return response.text();
          }
          return { err: `esearch api not responding, status ${response.status}` };
        })
        .catch((error) => {
          Utils.errobj('CLINIC-DB-LIB', 'eFetch FETCH ERROR', error);
          return { err: error };
        });

      if (eFetch.err !== undefined) {
        Utils.errobj('CLINIC-DB-LIB', 'eFetch error', eFetch);
        return 'fail';
      }
      const eFetchXML = await xml2js.parseStringPromise(eFetch);

      let meshTermsGroup = '';
      let substances = '';
      let grantSupports = '';
      let index = 0;
      // eslint-disable-next-line max-len
      if (
        eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0]?.MeshHeadingList?.[0]
          ?.MeshHeading
      ) {
        // eslint-disable-next-line max-len
        await eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].MeshHeadingList[0].MeshHeading.forEachAsync(
          async (mesh) => {
            meshTermsGroup += `${index === 0 ? '' : ' - '}${mesh.DescriptorName[0]._}`;
            index += 1;
          },
        );
      }

      // eslint-disable-next-line max-len
      if (
        eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0]?.ChemicalList?.[0]?.Chemical
      ) {
        index = 0;
        // eslint-disable-next-line max-len
        await eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].ChemicalList[0].Chemical.forEachAsync(
          async (chem) => {
            substances += `${index === 0 ? '' : ' - '}${chem.NameOfSubstance[0]._}`;
            index += 1;
          },
        );
      }

      // eslint-disable-next-line max-len
      if (
        eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.GrantList?.[0]
          ?.Grant
      ) {
        index = 0;
        // eslint-disable-next-line max-len
        await eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.GrantList[0].Grant.forEachAsync(
          async (grant) => {
            // eslint-disable-next-line max-len
            grantSupports += `${index === 0 ? '' : ' - '}${grant.GrantID?.[0] ?? '*'}/${
              grant.Acronym?.[0] ?? '*'
            }/${grant.Agency?.[0] ?? '*'}/${grant.Country?.[0] ?? '*'}`;
            index += 1;
          },
        );
      }

      await knex('term_entry').insert({
        id_term: entryTermAfterSave[0].id,
        id_entry: entry,
        // eslint-disable-next-line max-len
        title:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]
            ?.ArticleTitle[0],
        // eslint-disable-next-line max-len
        journal_title:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
            ?.Title[0],
        // eslint-disable-next-line max-len
        year: eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
          ?.JournalIssue[0]?.PubDate?.[0]?.Year?.[0],
        // eslint-disable-next-line max-len
        volume:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
            ?.JournalIssue[0]?.Volume?.[0],
        // eslint-disable-next-line max-len
        issue:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
            ?.JournalIssue[0]?.Issue?.[0],
        // eslint-disable-next-line max-len
        abstract:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Abstract?.[0]
            ?.AbstractText?.[0],
        mesh_terms: meshTermsGroup,
        substances,
        grant_supports: grantSupports,
      });
    } catch (error) {
      Utils.errobj('CLINIC-DB-LIB', 'esearch error', error);
    }
  });

  const entryTermsList = await knex
    .select()
    .from('term_entry')
    .where('id_term', entryTermAfterSave[0].id)
    .then((results) => results);

  Utils.logobj('CLINIC-DB-LIB', 'entryTermsList', entryTermsList);

  const worksheet = XLSX.utils.json_to_sheet(entryTermsList);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, termToSearch);
  XLSX.writeFile(workbook, `${termToSearch}-pubmed.xlsx`);
  const buffer = readFileSync(`${termToSearch}-pubmed.xlsx`);

  let docUploadPromise = Promise.resolve();
  // @ts-ignore
  docUploadPromise = s3
    .putObject({
      Body: buffer,
      Bucket: BUCKET,
      Key: `${termToSearch}-pubmed.xlsx`,
    })
    .promise();

  await docUploadPromise;
  return 'ok';
};

const syncTrialsDBData = async () => {
  Utils.log('CLINIC-DB-LIB', 'syncTrialsDBData');
  const termToSearch = 'Stefano+Luminari';

  const eSearch = await fetch(
    // eslint-disable-next-line max-len
    `https://clinicaltrials.gov/api/query/full_studies?expr=${termToSearch}&fmt=json&min_rnk=1&max_rnk=100`,
  )
    .then((response) => {
      if (response.status >= 200 && response.status <= 299) {
        return response.json();
      }
      return { err: `esearch api not responding, status ${response.status}` };
    })
    .catch((error) => {
      Utils.errobj('CLINIC-DB-LIB', 'clinicaltrials FETCH ERROR', error);
      return { err: error };
    });

  if (eSearch.err !== undefined) {
    return 'fail';
  }

  const entryTerm = await knex
    .select()
    .from('trials_search_item')
    .where('investigator', termToSearch)
    .then((results) => results);

  const entryBody = {
    investigator: termToSearch,
    n_studies_found: eSearch.FullStudiesResponse.NStudiesFound,
  };

  // eslint-disable-next-line no-unused-vars
  const result =
    entryTerm && entryTerm.length > 0
      ? await knex('trials_search_item').update(entryBody).where('id', entryTerm[0].id)
      : await knex('trials_search_item').insert(entryBody);

  const entryTermAfterSave = await knex
    .select()
    .from('trials_search_item')
    .where('investigator', termToSearch)
    .then((results) => results);

  await knex('study_entry').where('id_investigator', entryTermAfterSave[0].id).del();

  // eslint-disable-next-line consistent-return
  await eSearch.FullStudiesResponse.FullStudies.forEachAsync(async (entry) => {
    try {
      let overallOfficialNames = '';
      let overallOfficialAffiliations = '';
      let index = 0;
      if (
        // eslint-disable-next-line max-len
        entry.Study.ProtocolSection.ContactsLocationsModule.OverallOfficialList.OverallOfficial?.[0]
          ?.OverallOfficialName
      ) {
        // eslint-disable-next-line max-len
        await entry.Study.ProtocolSection.ContactsLocationsModule.OverallOfficialList.OverallOfficial.forEachAsync(
          async (official) => {
            overallOfficialNames += `${index === 0 ? '' : ' - '}${official.OverallOfficialName}`;
            // eslint-disable-next-line max-len
            overallOfficialAffiliations += `${index === 0 ? '' : ' - '}${
              official.OverallOfficialAffiliation
            }`;
            index += 1;
          },
        );
      }

      await knex('study_entry').insert({
        id_investigator: entryTermAfterSave[0].id,
        rank: entry.Rank,
        minimum_age: entry.Study.ProtocolSection.EligibilityModule?.MinimumAge,
        start_date: entry.Study.ProtocolSection.StatusModule?.StartDateStruct?.StartDate,
        // eslint-disable-next-line max-len
        completion_date:
          entry.Study.ProtocolSection.StatusModule?.CompletionDateStruct?.CompletionDate,
        brief_title: entry.Study.ProtocolSection.IdentificationModule?.BriefTitle,
        study_type: entry.Study.ProtocolSection.DesignModule?.Interventional,
        phase: entry.Study.ProtocolSection.DesignModule?.PhaseList?.Phase?.[0],
        // eslint-disable-next-line max-len
        interventions:
          entry.Study.ProtocolSection.ArmsInterventionsModule?.InterventionList?.Intervention?.[0]
            .InterventionName,
        // eslint-disable-next-line max-len
        overall_official_names: overallOfficialNames,
        overall_official_affiliations: overallOfficialAffiliations,
        // eslint-disable-next-line max-len
        lead_sponsor_name:
          entry.Study.ProtocolSection.SponsorCollaboratorsModule?.LeadSponsor?.LeadSponsorName,
      });
    } catch (error) {
      Utils.errobj('CLINIC-DB-LIB', 'esearch error', error);
    }
  });

  const entryTermsList = await knex
    .select()
    .from('study_entry')
    .where('id_investigator', entryTermAfterSave[0].id)
    .then((results) => results);

  Utils.logobj('CLINIC-DB-LIB', 'entryTermsList', entryTermsList);

  const worksheet = XLSX.utils.json_to_sheet(entryTermsList);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, termToSearch);
  XLSX.writeFile(workbook, `${termToSearch}-trials.xlsx`);
  const buffer = readFileSync(`${termToSearch}-trials.xlsx`);

  let docUploadPromise = Promise.resolve();
  // @ts-ignore
  docUploadPromise = s3
    .putObject({
      Body: buffer,
      Bucket: BUCKET,
      Key: `${termToSearch}-trials.xlsx`,
    })
    .promise();

  await docUploadPromise;
  return 'ok';
};

const syncClinicDBDataPerTerm = async (termToSearch) => {
  Utils.log('CLINIC-DB-LIB', 'syncClinicDBDataPerTerm');
  const dbPub = 'pubmed';
  const apiKey = 'c6830c2e17281d6f44c779ea5bf911cd1f08';

  const eSearch = await fetch(
    // eslint-disable-next-line max-len
    `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=${dbPub}&term=${termToSearch}&usehistory=y&api_key=${apiKey}&retmode=json&retmax=1000`,
  )
    .then((response) => {
      if (response.status >= 200 && response.status <= 299) {
        return response.json();
      }
      return { err: `esearch api not responding, status ${response.status}` };
    })
    .catch((error) => {
      Utils.errobj('CLINIC-DB-LIB', 'esearch FETCH ERROR', error);
      return { err: error };
    });

  if (eSearch.err !== undefined) {
    return 'fail';
  }

  const entryTerm = await knex
    .select()
    .from('term_search_item')
    .where('term', termToSearch)
    .then((results) => results);

  const entryBody = {
    term: termToSearch,
    count: eSearch.esearchresult.count,
    author_count: eSearch.esearchresult.translationstack[0].count,
    investigator_count: eSearch.esearchresult.translationstack[1].count,
  };

  // eslint-disable-next-line no-unused-vars
  const result =
    entryTerm && entryTerm.length > 0
      ? await knex('term_search_item').update(entryBody).where('id', entryTerm[0].id)
      : await knex('term_search_item').insert(entryBody);

  const entryTermAfterSave = await knex
    .select()
    .from('term_search_item')
    .where('term', termToSearch)
    .then((results) => results);

  await knex('term_entry').where('id_term', entryTermAfterSave[0].id).del();

  // eslint-disable-next-line consistent-return
  await eSearch.esearchresult.idlist.forEachAsync(async (entry) => {
    try {
      const eFetch = await fetch(
        // eslint-disable-next-line max-len
        `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=${dbPub}&id=${entry}&api_key=${apiKey}&retmode=xml`,
      )
        .then((response) => {
          if (response.status >= 200 && response.status <= 299) {
            return response.text();
          }
          return { err: `esearch api not responding, status ${response.status}` };
        })
        .catch((error) => {
          Utils.errobj('CLINIC-DB-LIB', 'eFetch FETCH ERROR', error);
          return { err: error };
        });

      if (eFetch.err !== undefined) {
        Utils.errobj('CLINIC-DB-LIB', 'eFetch error', eFetch);
        return 'fail';
      }
      const eFetchXML = await xml2js.parseStringPromise(eFetch);

      let meshTermsGroup = '';
      let substances = '';
      let grantSupports = '';
      let index = 0;
      // eslint-disable-next-line max-len
      if (
        eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0]?.MeshHeadingList?.[0]
          ?.MeshHeading
      ) {
        // eslint-disable-next-line max-len
        await eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].MeshHeadingList[0].MeshHeading.forEachAsync(
          async (mesh) => {
            meshTermsGroup += `${index === 0 ? '' : ' - '}${mesh.DescriptorName[0]._}`;
            index += 1;
          },
        );
      }

      // eslint-disable-next-line max-len
      if (
        eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0]?.ChemicalList?.[0]?.Chemical
      ) {
        index = 0;
        // eslint-disable-next-line max-len
        await eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].ChemicalList[0].Chemical.forEachAsync(
          async (chem) => {
            substances += `${index === 0 ? '' : ' - '}${chem.NameOfSubstance[0]._}`;
            index += 1;
          },
        );
      }

      // eslint-disable-next-line max-len
      if (
        eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.GrantList?.[0]
          ?.Grant
      ) {
        index = 0;
        // eslint-disable-next-line max-len
        await eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.GrantList[0].Grant.forEachAsync(
          async (grant) => {
            // eslint-disable-next-line max-len
            grantSupports += `${index === 0 ? '' : ' - '}${grant.GrantID?.[0] ?? '*'}/${
              grant.Acronym?.[0] ?? '*'
            }/${grant.Agency?.[0] ?? '*'}/${grant.Country?.[0] ?? '*'}`;
            index += 1;
          },
        );
      }

      await knex('term_entry').insert({
        id_term: entryTermAfterSave[0].id,
        id_entry: entry,
        // eslint-disable-next-line max-len
        title:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]
            ?.ArticleTitle[0],
        // eslint-disable-next-line max-len
        journal_title:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
            ?.Title[0],
        // eslint-disable-next-line max-len
        year: eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
          ?.JournalIssue[0]?.PubDate?.[0]?.Year?.[0],
        // eslint-disable-next-line max-len
        volume:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
            ?.JournalIssue[0]?.Volume?.[0],
        // eslint-disable-next-line max-len
        issue:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Journal[0]
            ?.JournalIssue[0]?.Issue?.[0],
        // eslint-disable-next-line max-len
        abstract:
          eFetchXML.PubmedArticleSet.PubmedArticle[0].MedlineCitation[0].Article[0]?.Abstract?.[0]
            ?.AbstractText?.[0],
        mesh_terms: meshTermsGroup,
        substances,
        grant_supports: grantSupports,
      });
    } catch (error) {
      Utils.errobj('CLINIC-DB-LIB', 'esearch error', error);
    }
  });

  return 'ok';
};

const exportAllClinicDBData = async () => {
  Utils.log('CLINIC-DB-LIB', 'exportAllClinicDBData');

  const entryTermsList = await knex
    .select()
    .from('term_entry')
    .then((results) => results);

  Utils.logobj('CLINIC-DB-LIB', 'entryTermsList', entryTermsList);

  const worksheet = XLSX.utils.json_to_sheet(entryTermsList);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'all-terms');
  XLSX.writeFile(workbook, `${'all-terms'}-pubmed.xlsx`);
  const buffer = readFileSync(`${'all-terms'}-pubmed.xlsx`);

  let docUploadPromise = Promise.resolve();
  // @ts-ignore
  docUploadPromise = s3
    .putObject({
      Body: buffer,
      Bucket: BUCKET,
      Key: `${'all-terms'}-pubmed.xlsx`,
    })
    .promise();

  await docUploadPromise;
  return 'ok';
};

const syncTrialsDBDataPerTerm = async (termToSearch) => {
  Utils.log('CLINIC-DB-LIB', 'syncTrialsDBDataPerTerm');

  const eSearch = await fetch(
    // eslint-disable-next-line max-len
    `https://clinicaltrials.gov/api/query/full_studies?expr=${termToSearch}&fmt=json&min_rnk=1&max_rnk=100`,
  )
    .then((response) => {
      if (response.status >= 200 && response.status <= 299) {
        return response.json();
      }
      return { err: `esearch api not responding, status ${response.status}` };
    })
    .catch((error) => {
      Utils.errobj('CLINIC-DB-LIB', 'clinicaltrials FETCH ERROR', error);
      return { err: error };
    });

  if (eSearch.err !== undefined) {
    return 'fail';
  }

  const entryTerm = await knex
    .select()
    .from('trials_search_item')
    .where('investigator', termToSearch)
    .then((results) => results);

  const entryBody = {
    investigator: termToSearch,
    n_studies_found: eSearch.FullStudiesResponse.NStudiesFound,
  };

  // eslint-disable-next-line no-unused-vars
  const result =
    entryTerm && entryTerm.length > 0
      ? await knex('trials_search_item').update(entryBody).where('id', entryTerm[0].id)
      : await knex('trials_search_item').insert(entryBody);

  const entryTermAfterSave = await knex
    .select()
    .from('trials_search_item')
    .where('investigator', termToSearch)
    .then((results) => results);

  await knex('study_entry').where('id_investigator', entryTermAfterSave[0].id).del();

  if (!eSearch.FullStudiesResponse.FullStudies) {
    return 'nada';
  }

  // eslint-disable-next-line consistent-return
  await eSearch.FullStudiesResponse.FullStudies.forEachAsync(async (entry) => {
    try {
      let overallOfficialNames = '';
      let overallOfficialAffiliations = '';
      let index = 0;
      if (
        // eslint-disable-next-line max-len
        entry.Study.ProtocolSection.ContactsLocationsModule?.OverallOfficialList
          ?.OverallOfficial?.[0]?.OverallOfficialName
      ) {
        // eslint-disable-next-line max-len
        await entry.Study.ProtocolSection.ContactsLocationsModule.OverallOfficialList.OverallOfficial.forEachAsync(
          async (official) => {
            overallOfficialNames += `${index === 0 ? '' : ' - '}${official.OverallOfficialName}`;
            // eslint-disable-next-line max-len
            overallOfficialAffiliations += `${index === 0 ? '' : ' - '}${
              official.OverallOfficialAffiliation
            }`;
            index += 1;
          },
        );
      }

      await knex('study_entry').insert({
        id_investigator: entryTermAfterSave[0].id,
        rank: entry.Rank,
        minimum_age: entry.Study.ProtocolSection.EligibilityModule?.MinimumAge,
        start_date: entry.Study.ProtocolSection.StatusModule?.StartDateStruct?.StartDate,
        // eslint-disable-next-line max-len
        completion_date:
          entry.Study.ProtocolSection.StatusModule?.CompletionDateStruct?.CompletionDate,
        brief_title: entry.Study.ProtocolSection.IdentificationModule?.BriefTitle,
        study_type: entry.Study.ProtocolSection.DesignModule?.Interventional,
        phase: entry.Study.ProtocolSection.DesignModule?.PhaseList?.Phase?.[0],
        // eslint-disable-next-line max-len
        interventions:
          entry.Study.ProtocolSection.ArmsInterventionsModule?.InterventionList?.Intervention?.[0]
            .InterventionName,
        // eslint-disable-next-line max-len
        overall_official_names: overallOfficialNames,
        overall_official_affiliations: overallOfficialAffiliations,
        // eslint-disable-next-line max-len
        lead_sponsor_name:
          entry.Study.ProtocolSection.SponsorCollaboratorsModule?.LeadSponsor?.LeadSponsorName,
      });
    } catch (error) {
      Utils.errobj('CLINIC-DB-LIB', 'esearch error', error);
    }
  });

  return 'ok';
};

const exportAllTrialsDBData = async () => {
  Utils.log('CLINIC-DB-LIB', 'exportAllTrialsDBData');

  const entryTermsList = await knex
    .select()
    .from('study_entry')
    .then((results) => results);

  const worksheet = XLSX.utils.json_to_sheet(entryTermsList);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'all-terms');
  XLSX.writeFile(workbook, `${'all-terms'}-trials.xlsx`);
  const buffer = readFileSync(`${'all-terms'}-trials.xlsx`);

  let docUploadPromise = Promise.resolve();
  // @ts-ignore
  docUploadPromise = s3
    .putObject({
      Body: buffer,
      Bucket: BUCKET,
      Key: `${'all-terms'}-trials.xlsx`,
    })
    .promise();

  await docUploadPromise;
  return 'ok';
};

const exportAllTerms = async () => {
  Utils.log('CLINIC-DB-LIB', 'exportAllTerms');

  const buffer = readFileSync('user-list.xlsx');
  const workbook = XLSX.read(buffer);
  const ws = workbook.Sheets.Foglio1;

  const usersList = XLSX.utils.sheet_to_json(ws);
  let index = 1;

  // @ts-ignore
  await usersList.forEachAsync(async (userTerm) => {
    Utils.logobj('CLINIC-DB-LIB', 'usersList', index);
    Utils.logobj('CLINIC-DB-LIB', 'usersList', userTerm);
    const userTermReplaced = userTerm.Name.replace(' ', '+');
    Utils.logobj('CLINIC-DB-LIB', 'usersList', { userTermReplaced });

    try {
      await syncClinicDBDataPerTerm(userTermReplaced);
    } catch (error) {
      Utils.logobj('CLINIC-DB-LIB', 'exportAllTerms', error);
    }

    try {
      await syncTrialsDBDataPerTerm(userTermReplaced);
    } catch (error) {
      Utils.logobj('CLINIC-DB-LIB', 'exportAllTerms', error);
    }

    await new Promise((resolve) => setTimeout(resolve, 10000));
    index += 1;
  });

  await exportAllClinicDBData();
  await exportAllTrialsDBData();

  return 'ok';
};

module.exports = {
  syncClinicDBData,
  syncClinicDBDataPerTerm,
  exportAllClinicDBData,
  syncTrialsDBData,
  syncTrialsDBDataPerTerm,
  exportAllTrialsDBData,
  exportAllTerms,
};
